import { createHash } from 'node:crypto';
import { and, eq, isNull, inArray, asc, sql } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '../../db/client';
import { organizations } from '../../db/schema';
import { members, projectGrants } from '../../db/team-schema';
import { projects, briefs, occurrences, programmeChanges, liturgicalDates } from '../../db/programme-schema';
import { type Actor, AccessError, requireFresh } from '../team/service';
import { projectInput, liturgyInput } from './validation';
import { scheduleOccurrences, shiftDate, dayDifference, isoDate } from './dates';
type DB = ReturnType<typeof getDb>; type Tx = Parameters<Parameters<DB['transaction']>[0]>[0]; type ReadDB = DB | Tx;
export class ProgrammeError extends Error {}
export function programmeService(db: DB) {
  async function member(connection: ReadDB, actor: Actor, orgId: string) {
    if (!actor.user.emailVerified || !z.uuid().safeParse(orgId).success) throw new AccessError();
    const [m] = await connection.select().from(members).where(and(eq(members.organizationId, orgId), eq(members.userId, actor.user.id), isNull(members.revokedAt)));
    if (!m) throw new AccessError(); return m;
  }
  async function authorized(connection: ReadDB, actor: Actor, orgId: string, projectId: string, edit = false) {
    const m = await member(connection, actor, orgId); if (!z.uuid().safeParse(projectId).success) throw new AccessError();
    const globalAllowed = m.role === 'admin' || m.permissions.includes('project.edit') || (!edit && m.permissions.includes('project.read'));
    if (!globalAllowed) throw new AccessError();
    const grants = await connection.select().from(projectGrants).where(and(eq(projectGrants.memberId, m.id), eq(projectGrants.projectId, projectId)));
    if (!grants.some(g => g.permission === 'project.edit' || (!edit && g.permission === 'project.read'))) throw new AccessError();
    const [project] = await connection.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.organizationId, orgId)));
    if (!project) throw new AccessError(); return project;
  }
  async function lockOrg(tx: Tx, orgId: string) { if (!z.uuid().safeParse(orgId).success) throw new AccessError(); await tx.select({ id: organizations.id }).from(organizations).where(eq(organizations.id, orgId)).for('update'); }
  async function modify(actor: Actor, orgId: string, projectId: string, revision: number, work: (tx: Tx, p: typeof projects.$inferSelect) => Promise<void>) {
    return db.transaction(async tx => {
      await lockOrg(tx, orgId); const p = await authorized(tx, actor, orgId, projectId, true);
      if (p.revision !== revision) throw new ProgrammeError('Le projet a changé. Actualisez la page avant de recommencer.');
      await work(tx, p); await tx.update(projects).set({ revision: p.revision + 1 }).where(eq(projects.id, p.id));
    });
  }
  return {
    async canCreate(actor: Actor, orgId: string) { const m = await member(db, actor, orgId); return m.role === 'admin' || m.permissions.includes('project.edit'); },
    async list(actor: Actor, orgId: string) {
      const m = await member(db, actor, orgId);
      if (m.role !== 'admin' && !m.permissions.some(x => x === 'project.read' || x === 'project.edit')) return [];
      const grants = await db.select({ projectId: projectGrants.projectId }).from(projectGrants).where(and(eq(projectGrants.memberId, m.id), inArray(projectGrants.permission, ['project.read','project.edit'])));
      if (!grants.length) return [];
      return db.select().from(projects).where(and(eq(projects.organizationId, orgId), inArray(projects.id, grants.map(g => g.projectId)))).orderBy(asc(projects.startDate));
    },
    async get(actor: Actor, orgId: string, projectId: string) {
      const project = await authorized(db, actor, orgId, projectId);
      const [brief] = await db.select().from(briefs).where(and(eq(briefs.projectId, projectId), eq(briefs.organizationId, orgId)));
      const events = await db.select().from(occurrences).where(eq(occurrences.projectId, projectId)).orderBy(asc(occurrences.sequence));
      const changes = await db.select().from(programmeChanges).where(eq(programmeChanges.projectId, projectId)).orderBy(asc(programmeChanges.createdAt));
      let canEdit = true; try { await authorized(db, actor, orgId, projectId, true); } catch { canEdit = false; }
      return { project, brief, events, changes, canEdit };
    },
    async create(actor: Actor, orgId: string, input: unknown) {
      const parsed = projectInput.parse(input);
      if (parsed.kind === 'campaign' && (parsed.cadence !== 'none' || !parsed.allDay)) throw new ProgrammeError('Une campagne est une période, sans faux événement ni récurrence.');
      const dates = scheduleOccurrences(parsed);
      const hash = createHash('sha256').update(JSON.stringify(parsed)).digest('hex');
      return db.transaction(async tx => {
        await lockOrg(tx, orgId); const m = await member(tx, actor, orgId);
        if (m.role !== 'admin' && !m.permissions.includes('project.edit')) throw new AccessError();
        const [previous] = await tx.select().from(projects).where(and(eq(projects.organizationId, orgId), eq(projects.creationKey, parsed.creationKey)));
        if (previous) { if (previous.createdBy !== actor.user.id || previous.inputHash !== hash) throw new ProgrammeError('Cette demande a déjà été enregistrée avec des valeurs différentes. Ouvrez le projet existant.'); return previous; }
        for (const id of [parsed.ownerId, parsed.validatorId, parsed.deputyId, parsed.decisionMakerId].filter(Boolean)) {
          const [person] = await tx.select().from(members).where(and(eq(members.id, id!), eq(members.organizationId, orgId), isNull(members.revokedAt)));
          if (!person) throw new AccessError('Une personne sélectionnée n’est plus membre de cet espace.');
          if (id === parsed.validatorId && !person.permissions.includes('content.validate')) throw new ProgrammeError('La personne choisie comme validateur doit disposer de la permission de validation dans Équipe.');
        }
        const { objective, audience, message, resources, usefulDate, decisionMakerId, ...projectValues } = parsed;
        const [project] = await tx.insert(projects).values({ ...projectValues, organizationId: orgId, createdBy: actor.user.id, inputHash: hash, startTime: parsed.allDay ? null : parsed.startTime, endTime: parsed.allDay ? null : parsed.endTime }).returning();
        await tx.insert(briefs).values({ organizationId: orgId, projectId: project.id, objective, audience, message, resources, usefulDate, decisionMakerId });
        if (parsed.kind === 'event') await tx.insert(occurrences).values(dates.map(date => ({ ...date, projectId: project.id })));
        await tx.insert(projectGrants).values(['project.read','project.edit'].map(permission => ({ memberId: m.id, projectId: project.id, permission })));
        await tx.insert(programmeChanges).values({ projectId: project.id, actorId: actor.user.id, action: 'created', reason: 'Projet préparé ; demande reçue, aucune mission acceptée implicitement.' });
        return project;
      });
    },
    async changeOccurrence(actor: Actor, orgId: string, projectId: string, revision: number, input: { occurrenceId: string; action: 'reschedule' | 'cancel'; date?: string; endDate?: string; startTime?: string; endTime?: string; reason: string }) {
      z.uuid().parse(input.occurrenceId); z.enum(['reschedule','cancel']).parse(input.action); const reason = z.string().trim().min(5).max(1000).parse(input.reason);
      return modify(actor, orgId, projectId, revision, async (tx, p) => {
        if (p.status !== 'preparation') throw new ProgrammeError('Ce projet est annulé ou archivé.');
        const [event] = await tx.select().from(occurrences).where(and(eq(occurrences.id, input.occurrenceId), eq(occurrences.projectId, p.id)));
        if (!event || event.status === 'cancelled') throw new ProgrammeError('Occurrence indisponible ou déjà annulée.');
        if (input.action === 'cancel') await tx.update(occurrences).set({ status: 'cancelled', isException: true, changeReason: reason }).where(eq(occurrences.id, event.id));
        else { const date = isoDate.parse(input.date); const endDate = input.endDate ? isoDate.parse(input.endDate) : shiftDate(date, dayDifference(event.startDate, event.endDate)); const [next] = scheduleOccurrences({ ...p, startDate: date, endDate, startTime: input.startTime || p.startTime, endTime: input.endTime || p.endTime, cadence: 'none', occurrenceCount: 1 }); await tx.update(occurrences).set({ startDate: next.startDate, endDate: next.endDate, startAt: next.startAt, endAt: next.endAt, status: 'rescheduled', isException: true, changeReason: reason }).where(eq(occurrences.id, event.id)); }
        await tx.insert(programmeChanges).values({ projectId: p.id, occurrenceId: event.id, actorId: actor.user.id, action: input.action, reason });
      });
    },
    async changeProject(actor: Actor, orgId: string, projectId: string, revision: number, input: { action: 'reschedule' | 'cancel' | 'archive'; date?: string; endDate?: string; startTime?: string; endTime?: string; reason: string }) {
      z.enum(['reschedule','cancel','archive']).parse(input.action); const reason = z.string().trim().min(5).max(1000).parse(input.reason);
      return modify(actor, orgId, projectId, revision, async (tx, p) => {
        if (p.status === 'archived' || (p.status === 'cancelled' && input.action !== 'archive')) throw new ProgrammeError('Ce projet ne peut plus être modifié dans cet état.');
        if (input.action === 'archive') await tx.update(projects).set({ status: 'archived' }).where(eq(projects.id, p.id));
        else if (input.action === 'cancel') { await tx.update(projects).set({ status: 'cancelled' }).where(eq(projects.id, p.id)); await tx.update(occurrences).set({ status: 'cancelled', changeReason: reason }).where(eq(occurrences.projectId, p.id)); }
        else {
          const startDate = isoDate.parse(input.date); const endDate = input.endDate ? isoDate.parse(input.endDate) : shiftDate(startDate, dayDifference(p.startDate, p.endDate)); const startTime = p.allDay ? null : input.startTime || p.startTime; const endTime = p.allDay ? null : input.endTime || p.endTime; const dates = scheduleOccurrences({ ...p, startDate, endDate, startTime, endTime });
          const current = await tx.select().from(occurrences).where(eq(occurrences.projectId, p.id));
          for (const event of current.filter(e => !e.isException)) { const next = dates[event.sequence]; await tx.update(occurrences).set({ startDate: next.startDate, endDate: next.endDate, startAt: next.startAt, endAt: next.endAt, changeReason: reason }).where(eq(occurrences.id, event.id)); }
          await tx.update(projects).set({ startDate, endDate, startTime, endTime }).where(eq(projects.id, p.id));
        }
        await tx.insert(programmeChanges).values({ projectId: p.id, actorId: actor.user.id, action: `${input.action}_project`, reason });
      });
    },
    async updateBrief(actor: Actor, orgId: string, projectId: string, revision: number, input: { title: string; objective: string; audience: string; message: string; resources: string; location: string; practicalInfo: string }) {
      const value = projectInput.pick({ title: true, objective: true, audience: true, message: true, resources: true, location: true, practicalInfo: true }).parse(input);
      return modify(actor, orgId, projectId, revision, async (tx, p) => { if (p.status !== 'preparation') throw new ProgrammeError('Projet annulé ou archivé.'); const { title, location, practicalInfo, ...brief } = value; await tx.update(projects).set({ title, location, practicalInfo }).where(eq(projects.id, p.id)); await tx.update(briefs).set({ ...brief, revision: sql`${briefs.revision} + 1`, status: sql`case when ${briefs.status} = 'accepted' then 'clarify' else ${briefs.status} end` }).where(eq(briefs.projectId, p.id)); await tx.insert(programmeChanges).values({ projectId: p.id, actorId: actor.user.id, action: 'brief_updated', reason: 'Informations du projet et demande corrigées, sans acceptation implicite.' }); });
    },
    async setAccess(actor: Actor, orgId: string, projectId: string, memberId: string, permissions: string[]) {
      requireFresh(actor); z.uuid().parse(projectId); z.uuid().parse(memberId); const values = z.array(z.enum(['project.read','project.edit','content.validate'])).max(3).parse(permissions);
      return db.transaction(async tx => {
        await lockOrg(tx, orgId); const admin = await member(tx, actor, orgId); if (admin.role !== 'admin') throw new AccessError();
        const [p] = await tx.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.organizationId, orgId))); if (!p) throw new AccessError();
        const [target] = await tx.select().from(members).where(and(eq(members.id, memberId), eq(members.organizationId, orgId), isNull(members.revokedAt))); if (!target) throw new AccessError();
        if (target.id === admin.id && !values.includes('project.read') && !values.includes('project.edit')) throw new ProgrammeError('Conservez votre accès pendant cette opération.');
        await tx.delete(projectGrants).where(and(eq(projectGrants.memberId, memberId), eq(projectGrants.projectId, projectId)));
        if (values.length) await tx.insert(projectGrants).values([...new Set(values)].map(permission => ({ memberId, projectId, permission })));
        await tx.insert(programmeChanges).values({ projectId, actorId: actor.user.id, action: 'access_changed', reason: `Portée projet modifiée pour l’appartenance ${memberId}. Les permissions globales restent nécessaires.` });
      });
    },
    async calendar(actor: Actor, orgId: string) {
      const list = await this.list(actor, orgId); const active = list.filter(p => p.status !== 'archived');
      const events = active.length ? await db.select().from(occurrences).where(inArray(occurrences.projectId, active.map(p => p.id))).orderBy(asc(occurrences.startDate)) : [];
      return { projects: active, events, liturgy: await db.select().from(liturgicalDates).where(eq(liturgicalDates.organizationId, orgId)).orderBy(asc(liturgicalDates.date)) };
    },
    async saveLiturgy(actor: Actor, orgId: string, input: unknown, id?: string, revision?: number) {
      requireFresh(actor); const value = liturgyInput.parse(input); if (id) z.uuid().parse(id);
      return db.transaction(async tx => { await lockOrg(tx, orgId); const admin = await member(tx, actor, orgId); if (admin.role !== 'admin') throw new AccessError();
        const { verified, ...data } = value; const record = { ...data, verifiedBy: verified ? actor.user.id : null, verifiedAt: verified ? new Date() : null };
        if (id) { const updated = await tx.update(liturgicalDates).set({ ...record, revision: (revision || 0) + 1 }).where(and(eq(liturgicalDates.id, id), eq(liturgicalDates.organizationId, orgId), eq(liturgicalDates.revision, revision || 0))).returning(); if (!updated.length) throw new ProgrammeError('Référence indisponible ou modifiée. Actualisez.'); return updated[0]; }
        const [created] = await tx.insert(liturgicalDates).values({ ...record, organizationId: orgId }).returning(); return created;
      });
    },
  };
}
