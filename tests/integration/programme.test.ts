import * as production from '../../src/db/production-schema';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { eq, inArray } from 'drizzle-orm';
import * as core from '../../src/db/schema';
import * as auth from '../../src/db/auth-schema';
import * as team from '../../src/db/team-schema';
import * as programme from '../../src/db/programme-schema';
import * as work from '../../src/db/work-schema';
import { programmeService } from '../../src/modules/programme/service';
import { teamService, type Actor } from '../../src/modules/team/service';
const schema = { ...core, ...auth, ...team, ...programme, ...work, ...production };
const url = process.env.TEST_DATABASE_URL;
if (!url || !new URL(url).pathname.endsWith('_test') || url === process.env.DATABASE_URL) throw new Error('Base de test dédiée requise.');
test('E4 : projets persistants, exceptions, révisions, droits et liturgie', async () => {
  const pool = new Pool({ connectionString: url }); const db = drizzle(pool,{ schema }); const orgIds: string[] = []; const userIds: string[] = [];
  try {
    await migrate(db, { migrationsFolder:'./drizzle' }); const service = programmeService(db);
    async function actor(): Promise<Actor> { const id = randomUUID(); const email = `${id}@test.invalid`; await db.insert(auth.user).values({ id, email, emailVerified:true, name:'TEST E4' }); userIds.push(id); return { user:{ id,email,emailVerified:true }, session:{ createdAt:new Date() } }; }
    const a = await actor(), b = await actor(), c = await actor(); const teams = teamService(db);
    const oa = await teams.createOrganization(a,{ name:'TEST E4 A',timezone:'Europe/Paris' }), ob = await teams.createOrganization(b,{ name:'TEST E4 B',timezone:'UTC' }); orgIds.push(oa.id,ob.id);
    const [mc] = await db.insert(team.members).values({ organizationId:oa.id,userId:c.user.id,permissions:['project.read'],professions:['administrateur'] }).returning();
    const input = { creationKey:randomUUID(),title:'TEST rencontre récurrente',kind:'event',eventType:'Rencontre',ministry:'',location:'Salle',practicalInfo:'Accès libre',ownerId:'',validatorId:'',deputyId:'',decisionMakerId:'',communicationLevel:'essential',timezone:'Europe/Paris',startDate:'2026-03-22',endDate:'2026-03-22',allDay:false,startTime:'10:00',endTime:'11:00',cadence:'weekly',occurrenceCount:3,objective:'Accueillir les bénévoles',audience:'Bénévoles',message:'Préparer une rencontre commune',resources:'',usefulDate:'' };
    const created = await Promise.all([service.create(a,oa.id,input),service.create(a,oa.id,input)]); assert.equal(created[0].id,created[1].id); const p = created[0];
    let detail = await service.get(a,oa.id,p.id); const ids = detail.events.map(e=>e.id); assert.equal(ids.length,3); assert.equal(detail.brief.status,'received');
    await assert.rejects(service.create(a,oa.id,{ ...input,title:'Valeurs modifiées' }));
    await assert.rejects(service.create(a,ob.id,{ ...input,creationKey:randomUUID() })); await assert.rejects(service.get(b,ob.id,p.id)); await assert.rejects(service.get(c,oa.id,p.id)); assert.equal((await service.calendar(c,oa.id)).events.length,0);
    await service.setAccess(a,oa.id,p.id,mc.id,['project.read']); assert.equal((await service.list(c,oa.id)).length,1); await assert.rejects(service.changeProject(c,oa.id,p.id,1,{ action:'cancel',reason:'Tentative non autorisée' }));
    const privateProject = await service.create(a,oa.id,{ ...input,creationKey:randomUUID(),title:'TEST projet privé',cadence:'none' }); assert.equal((await service.list(c,oa.id)).some(x=>x.id===privateProject.id),false);
    await service.changeOccurrence(a,oa.id,p.id,1,{ occurrenceId:ids[1],action:'reschedule',date:'2026-04-02',startTime:'14:00',endTime:'15:00',reason:'Indisponibilité de la salle' });
    await service.changeOccurrence(a,oa.id,p.id,2,{ occurrenceId:ids[2],action:'cancel',reason:'Rencontre annulée par décision' });
    await service.changeProject(a,oa.id,p.id,3,{ action:'reschedule',date:'2026-03-23',reason:'Décaler la série au lundi' }); detail = await service.get(a,oa.id,p.id);
    assert.deepEqual(detail.events.map(e=>e.id),ids); assert.deepEqual(detail.events.map(e=>e.startDate),['2026-03-23','2026-04-02','2026-04-05']); assert.equal(detail.events[1].startAt!.toISOString(),'2026-04-02T12:00:00.000Z'); assert.equal(detail.events[2].status,'cancelled'); assert.equal(detail.events[1].originalStartDate,'2026-03-29');
    await assert.rejects(service.changeProject(a,oa.id,p.id,3,{ action:'cancel',reason:'Ancienne révision refusée' }));
    const campaign = await service.create(a,oa.id,{ ...input,creationKey:randomUUID(),kind:'campaign',allDay:true,startTime:null,endTime:null,cadence:'none',occurrenceCount:1,startDate:'2026-09-01',endDate:'2026-09-30' }); assert.equal((await service.get(a,oa.id,campaign.id)).events.length,0); assert.ok((await service.calendar(a,oa.id)).projects.some(x=>x.id===campaign.id));
    const before = (await service.list(a,oa.id)).length; await assert.rejects(service.create(a,oa.id,{ ...input,creationKey:randomUUID(),startDate:'2026-03-29',endDate:'2026-03-29',startTime:'02:30' })); assert.equal((await service.list(a,oa.id)).length,before);
    const foreign = await teams.membership(b,ob.id); await assert.rejects(service.setAccess(a,oa.id,p.id,foreign.id,['project.read'])); await assert.rejects(service.create(a,oa.id,{ ...input,creationKey:randomUUID(),ownerId:foreign.id }));
    const liturgy = { title:'TEST référence manuelle',date:'2026-12-03',tradition:'Tradition de test',localCalendar:'Calendrier de test',source:'Document synthétique de test E4',verified:true };
    await assert.rejects(service.saveLiturgy(a,oa.id,{ ...liturgy,source:'' })); await assert.rejects(service.saveLiturgy(c,oa.id,liturgy)); const l = await service.saveLiturgy(a,oa.id,liturgy); assert.equal(l.verifiedBy,a.user.id); assert.equal((await service.calendar(b,ob.id)).liturgy.length,0);
    await assert.rejects(service.saveLiturgy(b,ob.id,{ ...liturgy,verified:false },l.id,1)); const corrected = await service.saveLiturgy(a,oa.id,{ ...liturgy,date:'2026-12-04',verified:false },l.id,1); assert.equal(corrected.verifiedAt,null); await assert.rejects(service.saveLiturgy(a,oa.id,liturgy,l.id,1));
    await service.changeProject(a,oa.id,p.id,4,{ action:'cancel',reason:'Annulation de toute la série' }); detail = await service.get(a,oa.id,p.id); assert.ok(detail.events.every(e=>e.status==='cancelled'));
    await service.changeProject(a,oa.id,p.id,5,{ action:'archive',reason:'Archiver en conservant les données' }); detail = await service.get(a,oa.id,p.id); assert.deepEqual(detail.events.map(e=>e.id),ids); assert.equal(detail.brief.status,'received'); assert.ok(detail.changes.length >= 6); assert.equal((await service.calendar(a,oa.id)).projects.some(x=>x.id===p.id),false);
    await db.update(team.members).set({ revokedAt:new Date() }).where(eq(team.members.id,mc.id)); await assert.rejects(service.get(c,oa.id,p.id));
  } finally {
    if (orgIds.length) {
      const ps = await db.select({ id:programme.projects.id }).from(programme.projects).where(inArray(programme.projects.organizationId,orgIds)); const ids=ps.map(p=>p.id);
      if(ids.length){await db.delete(team.projectGrants).where(inArray(team.projectGrants.projectId,ids)); await db.delete(programme.programmeChanges).where(inArray(programme.programmeChanges.projectId,ids)); await db.delete(programme.occurrences).where(inArray(programme.occurrences.projectId,ids)); await db.delete(programme.briefs).where(inArray(programme.briefs.projectId,ids)); await db.delete(programme.projects).where(inArray(programme.projects.id,ids));}
      await db.delete(programme.liturgicalDates).where(inArray(programme.liturgicalDates.organizationId,orgIds)); await db.delete(team.accessAudit).where(inArray(team.accessAudit.organizationId,orgIds)); await db.delete(team.members).where(inArray(team.members.organizationId,orgIds)); await db.delete(core.organizations).where(inArray(core.organizations.id,orgIds));
    }
    if(userIds.length) await db.delete(auth.user).where(inArray(auth.user.id,userIds)); await pool.end();
  }
});
