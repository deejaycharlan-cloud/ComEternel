import { canCreateTeam } from '../../config/owner';
import { createHash, randomBytes } from 'node:crypto';
import { and, eq, isNull, gt } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '../../db/client';
import { organizations } from '../../db/schema';
import { projects } from '../../db/programme-schema';
import { members, invitations, accessAudit, projectGrants, joinCodes, joinRequests, accountDeletions } from '../../db/team-schema';
import { session as sessions, user } from '../../db/auth-schema';
import { organizationInput } from '../organizations/validation';
import { profiles } from '../preview/data';
export type Actor = { user: { id: string; email: string; emailVerified: boolean }; session: { createdAt: Date } };
export const permissionNames = ['project.read', 'project.edit', 'content.validate'] as const;
const grantInput = z.object({ role: z.enum(['admin','member']), professions: z.array(z.enum(Object.keys(profiles) as [string, ...string[]])).max(8), permissions: z.array(z.enum(permissionNames)).max(3) });
export const invitationInput = grantInput.extend({ email: z.email().trim().toLowerCase() });
const uuid = z.uuid();
export class AccessError extends Error { constructor(message = 'Accès indisponible ou non autorisé.') { super(message); } }
export function requireFresh(actor: Actor) {
  const age = Date.now() - new Date(actor.session.createdAt).getTime();
  if (!actor.user.emailVerified || !Number.isFinite(age) || age < 0 || age > 300_000) throw new AccessError('Reconnectez-vous pour confirmer cette opération d’administration (connexion de moins de 5 minutes).');
}
export function teamService(db: ReturnType<typeof getDb>) {
  async function membership(actor: Actor, orgId: string) {
    if (!actor.user.emailVerified || !uuid.safeParse(orgId).success) throw new AccessError();
    const [member] = await db.select().from(members).where(and(eq(members.organizationId, orgId), eq(members.userId, actor.user.id), isNull(members.revokedAt)));
    if (!member) throw new AccessError();
    return member;
  }
  async function adminTx<T>(actor: Actor, orgId: string, work: (tx: Parameters<Parameters<typeof db.transaction>[0]>[0]) => Promise<T>) {
    requireFresh(actor);
    if (!uuid.safeParse(orgId).success) throw new AccessError();
    return db.transaction(async tx => {
      await tx.select({ id: organizations.id }).from(organizations).where(eq(organizations.id, orgId)).for('update');
      const [member] = await tx.select().from(members).where(and(eq(members.organizationId, orgId), eq(members.userId, actor.user.id), isNull(members.revokedAt)));
      if (!member || member.role !== 'admin') throw new AccessError();
      return work(tx);
    });
  }
  return {
    membership,
    async getJoinCode(actor: Actor, orgId: string) {
      const member = await membership(actor, orgId); if (member.role !== 'admin') throw new AccessError();
      await db.insert(joinCodes).values({ organizationId: orgId, code: randomBytes(8).toString('hex').toUpperCase() }).onConflictDoNothing();
      const [row] = await db.select().from(joinCodes).where(eq(joinCodes.organizationId, orgId)); return row.code;
    },
    async requestJoin(emailInput: unknown, codeInput: unknown) {
      const email = z.email().max(254).parse(emailInput).trim().toLowerCase();
      const code = z.string().trim().toUpperCase().regex(/^[A-F0-9]{16}$/).parse(codeInput);
      const [org] = await db.select().from(joinCodes).where(eq(joinCodes.code, code));
      if (!org) return;
      const [created] = await db.insert(joinRequests).values({organizationId: org.organizationId,email}).onConflictDoNothing().returning({id:joinRequests.id});
      return created?.id;
    },
    async listJoinRequests(actor: Actor, orgId: string) {
      const member = await membership(actor, orgId); if (member.role !== 'admin') throw new AccessError();
      return db.select().from(joinRequests).where(and(eq(joinRequests.organizationId,orgId),eq(joinRequests.status,'pending')));
    },
    async reviewJoin(actor: Actor, orgId: string, id: string, approve: boolean, input: unknown) {
      uuid.parse(id); const grants = approve ? grantInput.parse(input) : null;
      return adminTx(actor, orgId, async tx => {
        const [request] = await tx.select().from(joinRequests).where(and(eq(joinRequests.id,id),eq(joinRequests.organizationId,orgId),eq(joinRequests.status,'pending'))).for('update');
        if (!request) throw new AccessError('Demande déjà traitée ou indisponible.');
        let result: {email:string;token:string}|null = null;
        if (grants) {
          const token = randomBytes(32).toString('base64url');
          await tx.insert(invitations).values({...grants,organizationId:orgId,email:request.email,createdBy:actor.user.id,tokenHash:createHash('sha256').update(token).digest('hex'),expiresAt:new Date(Date.now()+48*60*60*1000)});
          result = {email:request.email,token};
        }
        await tx.update(joinRequests).set({status:approve?'approved':'rejected'}).where(eq(joinRequests.id,id));
        await tx.insert(accessAudit).values({organizationId:orgId,actorId:actor.user.id,action:approve?'join.approved':'join.rejected',targetId:id});
        return result;
      });
    },
    async listOrganizations(actor: Actor) {
      if (!actor.user.emailVerified) throw new AccessError();
      return db.select({ id: organizations.id, name: organizations.name, timezone: organizations.timezone, role: members.role }).from(members).innerJoin(organizations, eq(members.organizationId, organizations.id)).where(and(eq(members.userId, actor.user.id), isNull(members.revokedAt)));
    },
    async createOrganization(actor: Actor, input: unknown) {
      requireFresh(actor); if (!canCreateTeam(actor.user)) throw new AccessError('Vérifiez votre adresse email avant de créer votre association.'); const value = organizationInput.parse(input);
      return db.transaction(async tx => {
        await tx.select().from(user).where(eq(user.id,actor.user.id)).for('update');
        if((await tx.select().from(accountDeletions).where(eq(accountDeletions.userId,actor.user.id))).length)throw new AccessError('Annulez la suppression de votre compte avant de créer une association.');
        const [org] = await tx.insert(organizations).values(value).returning();
        await tx.insert(members).values({ organizationId: org.id, userId: actor.user.id, role: 'admin', professions: ['administrateur'], permissions: [] });
        await tx.insert(accessAudit).values({ organizationId: org.id, actorId: actor.user.id, action: 'organization.created' });
        return org;
      });
    },
    async listMembers(actor: Actor, orgId: string) {
      await membership(actor, orgId);
      return db.select({ id: members.id, name: user.name, email: user.email, role: members.role, professions: members.professions, permissions: members.permissions, revokedAt: members.revokedAt }).from(members).innerJoin(user, eq(user.id, members.userId)).where(eq(members.organizationId, orgId));
    },
    async listInvitations(actor: Actor, orgId: string) {
      const m = await membership(actor, orgId); if (m.role !== 'admin') throw new AccessError();
      return db.select({ id: invitations.id, email: invitations.email, expiresAt: invitations.expiresAt, acceptedAt: invitations.acceptedAt, revokedAt: invitations.revokedAt }).from(invitations).where(eq(invitations.organizationId, orgId));
    },
    async invite(actor: Actor, orgId: string, input: unknown) {
      const value = invitationInput.parse(input); const token = randomBytes(32).toString('base64url');
      return adminTx(actor, orgId, async tx => {
        const [invitation] = await tx.insert(invitations).values({ ...value, organizationId: orgId, createdBy: actor.user.id, tokenHash: createHash('sha256').update(token).digest('hex'), expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000) }).returning({ id: invitations.id });
        await tx.insert(accessAudit).values({ organizationId: orgId, actorId: actor.user.id, action: 'invitation.created', targetId: invitation.id });
        return { id: invitation.id, token, email: value.email };
      });
    },
    async accept(actor: Actor, token: string) {
      if (!actor.user.emailVerified || !/^[\w-]{43}$/.test(token)) throw new AccessError('Invitation indisponible.');
      return db.transaction(async tx => {
        const hash = createHash('sha256').update(token).digest('hex');
        const [candidate] = await tx.select({ organizationId: invitations.organizationId }).from(invitations).where(and(eq(invitations.tokenHash, hash), eq(invitations.email, actor.user.email.toLowerCase())));
        if (!candidate) throw new AccessError('Invitation indisponible.');
        // Même ordre de verrouillage que les opérations administratives et le départ.
        await tx.select({ id: organizations.id }).from(organizations).where(eq(organizations.id, candidate.organizationId)).for('update');
        const [invitation] = await tx.select().from(invitations).where(and(eq(invitations.tokenHash, hash), eq(invitations.email, actor.user.email.toLowerCase()), isNull(invitations.acceptedAt), isNull(invitations.revokedAt), gt(invitations.expiresAt, new Date()))).for('update');
        if (!invitation) throw new AccessError('Invitation indisponible.');
        const [existing] = await tx.select().from(members).where(and(eq(members.organizationId, invitation.organizationId), eq(members.userId, actor.user.id)));
        if (existing && !existing.revokedAt) throw new AccessError('Vous faites déjà partie de cet espace.');
        const values = { role: invitation.role, professions: invitation.professions, permissions: invitation.permissions, revokedAt: null };
        if (existing) { await tx.delete(projectGrants).where(eq(projectGrants.memberId, existing.id)); await tx.update(members).set(values).where(eq(members.id, existing.id)); }
        else await tx.insert(members).values({ ...values, organizationId: invitation.organizationId, userId: actor.user.id });
        await tx.update(invitations).set({ acceptedAt: new Date() }).where(eq(invitations.id, invitation.id));
        await tx.insert(accessAudit).values({ organizationId: invitation.organizationId, actorId: actor.user.id, action: 'invitation.accepted', targetId: invitation.id });
        return invitation.organizationId;
      });
    },
    async revokeInvitation(actor: Actor, orgId: string, id: string) {
      uuid.parse(id); await adminTx(actor, orgId, async tx => {
        const changed = await tx.update(invitations).set({ revokedAt: new Date() }).where(and(eq(invitations.id, id), eq(invitations.organizationId, orgId), isNull(invitations.acceptedAt), isNull(invitations.revokedAt))).returning();
        if (!changed.length) throw new AccessError();
        await tx.insert(accessAudit).values({ organizationId: orgId, actorId: actor.user.id, action: 'invitation.revoked', targetId: id });
      });
    },
    async changeMember(actor: Actor, orgId: string, id: string, input: unknown | null) {
      uuid.parse(id); const value = input === null ? null : grantInput.parse(input);
      await adminTx(actor, orgId, async tx => {
        const [target] = await tx.select().from(members).where(and(eq(members.id, id), eq(members.organizationId, orgId), isNull(members.revokedAt)));
        if (!target) throw new AccessError();
        if (target.role === 'admin' && (!value || value.role !== 'admin')) {
          const admins = await tx.select().from(members).where(and(eq(members.organizationId, orgId), eq(members.role, 'admin'), isNull(members.revokedAt)));
          if (admins.length <= 1) throw new AccessError('Désignez un autre administrateur avant ce départ ou changement de rôle.');
        }
        await tx.update(members).set(value || { revokedAt: new Date() }).where(eq(members.id, id));
        await tx.delete(sessions).where(eq(sessions.userId, target.userId));
        if (!value) {
          await tx.delete(projectGrants).where(eq(projectGrants.memberId, id));
          const [person] = await tx.select({ email: user.email }).from(user).where(eq(user.id, target.userId));
          await tx.update(invitations).set({ revokedAt: new Date() }).where(and(eq(invitations.organizationId, orgId), eq(invitations.email, person.email), isNull(invitations.acceptedAt)));
        }
        await tx.insert(accessAudit).values({ organizationId: orgId, actorId: actor.user.id, action: value ? 'member.permissions_changed' : 'member.departed_external_access_review_required', targetId: id });
      });
    },
    async requireProjectPermission(actor: Actor, orgId: string, projectId: string, permission: typeof permissionNames[number]) {
      uuid.parse(projectId); if (!permissionNames.includes(permission)) throw new AccessError();
      const member = await membership(actor, orgId);
      // Aucune permission de validation implicite, même pour un administrateur.
      const globalAllowed = member.permissions.includes(permission) || (permission !== 'content.validate' && member.role === 'admin') || (permission === 'project.read' && member.permissions.includes('project.edit'));
      if (!globalAllowed) throw new AccessError();
      const [project] = await db.select({ id: projects.id }).from(projects).where(and(eq(projects.id, projectId), eq(projects.organizationId, orgId)));
      if (!project) throw new AccessError();
      const [grant] = await db.select({ id: projectGrants.id }).from(projectGrants).where(and(eq(projectGrants.memberId, member.id), eq(projectGrants.projectId, projectId), eq(projectGrants.permission, permission)));
      if (!grant) throw new AccessError();
    },
  };
}
