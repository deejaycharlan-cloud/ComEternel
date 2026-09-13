import * as production from '../../src/db/production-schema';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { eq, inArray } from 'drizzle-orm';
import * as core from '../../src/db/schema';
import * as authSchema from '../../src/db/auth-schema';
import * as team from '../../src/db/team-schema';
import * as programme from '../../src/db/programme-schema';
import * as work from '../../src/db/work-schema';
import { createAuth } from '../../src/modules/identity/auth';
import { teamService, type Actor } from '../../src/modules/team/service';
const url = process.env.TEST_DATABASE_URL;
if (!url || !new URL(url).pathname.endsWith('_test') || url === process.env.DATABASE_URL) throw new Error('Base de test dédiée requise.');
const schema = { ...core, ...authSchema, ...team, ...programme, ...work, ...production };
test('E3 : sessions réelles, lien unique, invitations, refus et départ', async () => {
  const pool = new Pool({ connectionString: url }); const db = drizzle(pool, { schema }); const orgIds: string[] = []; const userIds: string[] = []; const emails: string[] = [];
  const letters: string[] = [];
  const auth = createAuth(db, async (_email, _subject, body) => { letters.push(body); });
  const base = process.env.BETTER_AUTH_URL!;
  const verificationRequest = (link: string) => new Request(link, { headers: { 'x-forwarded-for': `2001:db8:${randomUUID().slice(0,4)}:${randomUUID().slice(0,4)}::1` } });
  const cookieOf = (r: Response) => r.headers.getSetCookie().map(c => c.split(';')[0]).join('; ');
  async function requestLink(email: string) {
    await auth.api.signInMagicLink({ headers: new Headers({ origin: base }), body: { email, callbackURL: '/compte' } });
    const link = letters.at(-1)!.split('\n').find(line => line.startsWith('http'))!;
    return link;
  }
  async function login(email: string) {
    const link = await requestLink(email);
    const response = await auth.handler(verificationRequest(link));
    const cookie = cookieOf(response);
    const actor = await auth.api.getSession({ headers: new Headers({ cookie }) });
    assert.ok(actor?.user.emailVerified, 'une vraie session Better Auth est créée');
    userIds.push(actor.user.id); emails.push(actor.user.email);
    return { actor, cookie, link };
  }
  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    assert.equal(await auth.api.getSession({ headers: new Headers() }), null);
    const suffix = randomUUID();
    const passwordEmail=`password-${suffix}@test.invalid`;
    const signup=await auth.api.signUpEmail({body:{email:passwordEmail,name:'TEST password',password:'Synthetic-test-password-2026',callbackURL:'/compte'}});
    userIds.push(signup.user.id);emails.push(passwordEmail);
    await assert.rejects(auth.api.signInEmail({body:{email:passwordEmail,password:'Synthetic-test-password-2026'}}));
    const verifyLink=letters.at(-1)!.split('\n').find(line=>line.startsWith('http'))!;
    await auth.handler(new Request(verifyLink));
    const passwordSession=await auth.api.signInEmail({body:{email:passwordEmail,password:'Synthetic-test-password-2026'}});
    assert.ok(passwordSession.token);
    await assert.rejects(auth.api.signInEmail({body:{email:passwordEmail,password:'Wrong-password-2026'}}));
    await auth.api.requestPasswordReset({body:{email:passwordEmail,redirectTo:'/nouveau-mot-de-passe'}});
    const resetLink=letters.at(-1)!.split('\n').find(line=>line.startsWith('http'))!;
    const resetToken=new URL(resetLink).pathname.split('/').at(-1)!;
    await auth.api.resetPassword({body:{token:resetToken,newPassword:'Replacement-test-password-2026'}});
    await assert.rejects(auth.api.resetPassword({body:{token:resetToken,newPassword:'Another-test-password-2026'}}));
    await assert.rejects(auth.api.signInEmail({body:{email:passwordEmail,password:'Synthetic-test-password-2026'}}));
    assert.ok((await auth.api.signInEmail({body:{email:passwordEmail,password:'Replacement-test-password-2026'}})).token);

    const a = await login(`a-${suffix}@test.invalid`); const b = await login(`b-${suffix}@test.invalid`); const c = await login(`c-${suffix}@test.invalid`);
    const reused = await auth.handler(verificationRequest(a.link)); assert.equal(cookieOf(reused).includes('session_token='), false);
    const expired = await requestLink(a.actor.user.email);
    await db.update(authSchema.verification).set({ expiresAt: new Date(0) }).where(eq(authSchema.verification.value, JSON.stringify({ email: a.actor.user.email })));
    assert.equal(cookieOf(await auth.handler(verificationRequest(expired))).includes('session_token='), false);
    const concurrentLink = await requestLink(a.actor.user.email);
    const concurrentResponses = await Promise.all([auth.handler(verificationRequest(concurrentLink)), auth.handler(verificationRequest(concurrentLink))]);
    assert.equal(concurrentResponses.filter(r => cookieOf(r).includes('session_token=')).length, 1, JSON.stringify(concurrentResponses.map(r => ({ status: r.status, error: new URL(r.headers.get('location') || base).searchParams.get('error') }))));
    assert.equal(auth.options.account?.accountLinking?.enabled, false);
    const service = teamService(db);
    const orgA = await service.createOrganization(a.actor, { name: 'TEST organisation A', timezone: 'UTC' }); orgIds.push(orgA.id);
    const orgB = await service.createOrganization(b.actor, { name: 'TEST organisation B', timezone: 'Europe/Paris' }); orgIds.push(orgB.id);
    assert.deepEqual((await service.listOrganizations(a.actor)).map(o => o.id), [orgA.id]);
    assert.equal((await service.membership(a.actor, orgA.id)).role, 'admin');
    assert.equal((await service.membership(b.actor, orgB.id)).role, 'admin');
    await assert.rejects(service.createOrganization({ ...c.actor, user: { ...c.actor.user, emailVerified: false } }, { name: 'TEST refus', timezone: 'UTC' }));

    await assert.rejects(service.listMembers(a.actor, orgB.id));
    await assert.rejects(service.invite(a.actor, orgB.id, { email: c.actor.user.email, role: 'member', professions: [], permissions: [] }));
    const codeA=await service.getJoinCode(a.actor,orgA.id);
    assert.equal(await service.getJoinCode(a.actor,orgA.id),codeA);
    await assert.rejects(service.getJoinCode(b.actor,orgA.id));
    await service.requestJoin(c.actor.user.email,codeA);
    await service.requestJoin(c.actor.user.email,codeA);
    const requests=await service.listJoinRequests(a.actor,orgA.id); assert.equal(requests.length,1);
    assert.equal((await service.listJoinRequests(b.actor,orgB.id)).length,0);
    await assert.rejects(service.membership(c.actor,orgA.id));
    await assert.rejects(service.reviewJoin(b.actor,orgA.id,requests[0].id,true,{role:'admin',professions:[],permissions:[]}));
    const approved=await service.reviewJoin(a.actor,orgA.id,requests[0].id,true,{role:'member',professions:['photographe'],permissions:['project.read']});
    assert.ok(approved?.token);
    await assert.rejects(service.membership(c.actor,orgA.id));
    await assert.rejects(service.accept(b.actor,approved.token));
    await assert.rejects(service.reviewJoin(a.actor,orgA.id,requests[0].id,true,{role:'admin',professions:[],permissions:[]}));
    assert.equal((await service.listJoinRequests(a.actor,orgA.id)).length,0);
    const old: Actor = { ...a.actor, session: { createdAt: new Date(Date.now() - 600_000) } };
    await assert.rejects(service.invite(old, orgA.id, { email: c.actor.user.email, role: 'member', professions: [], permissions: [] }));
    const invitation = await service.invite(a.actor, orgA.id, { email: c.actor.user.email, role: 'member', professions: ['validation', 'photographe'], permissions: ['project.read'] });
    await assert.rejects(service.accept(b.actor, invitation.token));
    const accepted = await Promise.allSettled([service.accept(c.actor, invitation.token), service.accept(c.actor, invitation.token)]);
    assert.equal(accepted.filter(r => r.status === 'fulfilled').length, 1);
    const memberC = await service.membership(c.actor, orgA.id);
    assert.equal(memberC.role, 'member');
    await assert.rejects(service.invite(c.actor, orgA.id, { email: b.actor.user.email, role: 'admin', professions: [], permissions: [] }));
    const projectA = randomUUID(), projectB = randomUUID();
    await db.insert(programme.projects).values({ id: projectA, organizationId: orgA.id, createdBy: a.actor.user.id, creationKey: randomUUID(), inputHash: 'TEST', title: 'Projet de test E3', kind: 'event', eventType: 'Test', communicationLevel: 'essential', timezone: 'UTC', startDate: '2026-09-13', endDate: '2026-09-13', allDay: true, cadence: 'none', occurrenceCount: 1 });
    await db.insert(team.projectGrants).values({ memberId: memberC.id, projectId: projectA, permission: 'project.read' });
    await service.requireProjectPermission(c.actor, orgA.id, projectA, 'project.read');
    await assert.rejects(service.requireProjectPermission(c.actor, orgA.id, projectB, 'project.read'));
    await assert.rejects(service.requireProjectPermission(c.actor, orgB.id, projectA, 'project.read'));
    await assert.rejects(service.requireProjectPermission(c.actor, orgA.id, projectA, 'content.validate'));
    await assert.rejects(service.requireProjectPermission(a.actor, orgA.id, projectA, 'content.validate'));
    const adminA = await service.membership(a.actor, orgA.id);
    await assert.rejects(service.changeMember(a.actor, orgA.id, adminA.id, null));
    await assert.rejects(service.changeMember(b.actor, orgB.id, memberC.id, null));
    const revoked = await service.invite(a.actor, orgA.id, { email: b.actor.user.email, role: 'member', professions: [], permissions: [] });
    await service.revokeInvitation(a.actor, orgA.id, revoked.id); await assert.rejects(service.accept(b.actor, revoked.token));
    const timed = await service.invite(a.actor, orgA.id, { email: b.actor.user.email, role: 'member', professions: [], permissions: [] });
    await db.update(team.invitations).set({ expiresAt: new Date(0) }).where(eq(team.invitations.id, timed.id)); await assert.rejects(service.accept(b.actor, timed.token));
    const pendingRejoin = await service.invite(a.actor, orgA.id, { email: c.actor.user.email, role: 'member', professions: [], permissions: [] });
    await service.changeMember(a.actor, orgA.id, memberC.id, null);
    assert.equal(await auth.api.getSession({ headers: new Headers({ cookie: c.cookie }) }), null);
    await assert.rejects(service.membership(c.actor, orgA.id));
    await assert.rejects(service.accept(c.actor, pendingRejoin.token));
    assert.equal((await db.select().from(team.projectGrants).where(eq(team.projectGrants.memberId, memberC.id))).length, 0);
    const rateStatuses: number[] = [];
    for (let i = 0; i < 4; i++) {
      const res = await auth.handler(new Request(`${base}/api/auth/sign-in/magic-link`, { method: 'POST', headers: { 'content-type': 'application/json', origin: base, 'x-forwarded-for': `2001:db8:${suffix.slice(0,4)}::1` }, body: JSON.stringify({ email: a.actor.user.email, callbackURL: '/compte' }) })); rateStatuses.push(res.status);
    }
    assert.deepEqual(rateStatuses, [200, 200, 200, 429]);
    const csrf = await auth.handler(new Request(`${base}/api/auth/sign-in/magic-link`, { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://untrusted.invalid' }, body: JSON.stringify({ email: a.actor.user.email }) }));
    assert.equal(csrf.status, 403);
    await auth.api.signOut({ headers: new Headers({ cookie: a.cookie }) });
    assert.equal(await auth.api.getSession({ headers: new Headers({ cookie: a.cookie }) }), null);
    await db.update(authSchema.session).set({ expiresAt: new Date(0) }).where(eq(authSchema.session.id, b.actor.session.id));
    assert.equal(await auth.api.getSession({ headers: new Headers({ cookie: b.cookie }) }), null);
  } finally {
    if (orgIds.length) {
      await db.delete(team.joinRequests).where(inArray(team.joinRequests.organizationId,orgIds));
      await db.delete(team.joinCodes).where(inArray(team.joinCodes.organizationId,orgIds));
      const ms = await db.select({ id: team.members.id }).from(team.members).where(inArray(team.members.organizationId, orgIds));
      if (ms.length) await db.delete(team.projectGrants).where(inArray(team.projectGrants.memberId, ms.map(m => m.id)));
      await db.delete(programme.projects).where(inArray(programme.projects.organizationId, orgIds));
      await db.delete(team.accessAudit).where(inArray(team.accessAudit.organizationId, orgIds)); await db.delete(team.invitations).where(inArray(team.invitations.organizationId, orgIds)); await db.delete(team.members).where(inArray(team.members.organizationId, orgIds)); await db.delete(core.organizations).where(inArray(core.organizations.id, orgIds));
    }
    if (emails.length) await db.delete(authSchema.verification).where(inArray(authSchema.verification.value, emails.map(email => JSON.stringify({ email }))));
    if (userIds.length) await db.delete(authSchema.user).where(inArray(authSchema.user.id, userIds));
    await pool.end();
  }
});
