import {and,eq,isNull,inArray,lte,sql} from 'drizzle-orm';
import {randomUUID} from 'node:crypto';
import {getDb} from '../../db/client';
import {user,account,session,verification} from '../../db/auth-schema';
import {organizations} from '../../db/schema';
import {members,accountDeletions,organizationDeletions,erasedFiles,googleCalendars,joinRequests,invitations,projectGrants} from '../../db/team-schema';
import {AccessError,requireFresh,type Actor} from '../team/service';
import {driveConnections} from '../../db/production-schema';
import {availabilities} from '../../db/work-schema';
import {removeStored} from '../production/storage';
type DB=ReturnType<typeof getDb>;
export function deletionService(db:DB){
 async function lock(tx:DB|Parameters<Parameters<DB['transaction']>[0]>[0],id:string){await tx.select().from(organizations).where(eq(organizations.id,id)).for('update');}
 return {
 async schedule(a:Actor,confirm:string){requireFresh(a);if(confirm!=='SUPPRIMER')throw new AccessError('Saisissez SUPPRIMER pour confirmer.');return db.transaction(async tx=>{
  await tx.select().from(user).where(eq(user.id,a.user.id)).for('update');
  const [old]=await tx.select().from(accountDeletions).where(eq(accountDeletions.userId,a.user.id));if(old)return old;
  const dueAt=new Date(Date.now()+30*86400000);
  const spaces=await tx.select().from(members).where(and(eq(members.userId,a.user.id),eq(members.role,'admin'),isNull(members.revokedAt)));
  for(const s of spaces.sort((a,b)=>a.organizationId.localeCompare(b.organizationId))){await lock(tx,s.organizationId);const [current]=await tx.select().from(members).where(and(eq(members.id,s.id),eq(members.role,'admin'),isNull(members.revokedAt)));if(!current)continue;await tx.insert(organizationDeletions).values({organizationId:s.organizationId,requestedBy:a.user.id,dueAt}).onConflictDoNothing();}
  const [row]=await tx.insert(accountDeletions).values({userId:a.user.id,dueAt}).returning();return row;
 });},
 async cancel(a:Actor){requireFresh(a);await db.transaction(async tx=>{await tx.select().from(user).where(eq(user.id,a.user.id)).for('update');await tx.delete(organizationDeletions).where(eq(organizationDeletions.requestedBy,a.user.id));await tx.delete(accountDeletions).where(and(eq(accountDeletions.userId,a.user.id),eq(accountDeletions.status,'pending')));});},
 async transfer(a:Actor,org:string,target:string){requireFresh(a);await db.transaction(async tx=>{
  await lock(tx,org);const [pending]=await tx.select().from(organizationDeletions).where(eq(organizationDeletions.organizationId,org));
  const [me]=await tx.select().from(members).where(and(eq(members.organizationId,org),eq(members.userId,a.user.id),eq(members.role,'admin'),isNull(members.revokedAt)));
  if(!pending||pending.dueAt<=new Date()||!me)throw new AccessError('Transfert indisponible.');
  const [next]=await tx.select().from(members).innerJoin(user,eq(user.id,members.userId)).where(and(eq(members.id,target),eq(members.organizationId,org),isNull(members.revokedAt)));
  if(!next||!next.auth_user.emailVerified||next.members.userId===pending.requestedBy)throw new AccessError('Choisissez un autre membre confirmé de cette association.');
  const [leaving]=await tx.select().from(accountDeletions).where(eq(accountDeletions.userId,next.members.userId));if(leaving)throw new AccessError('Ce membre a aussi demandé la suppression de son compte.');
  await tx.update(members).set({role:'admin'}).where(eq(members.id,target));
  await tx.update(members).set({role:'member'}).where(and(eq(members.organizationId,org),eq(members.userId,pending.requestedBy)));
  await tx.delete(organizationDeletions).where(eq(organizationDeletions.organizationId,org));
 });},
 };
}
// Only processes dates already confirmed by authenticated users. No caller-supplied target or date.
export async function processDeletions(db:DB,remove=removeStored){
 await db.transaction(async tx=>{
  const locked=await tx.execute(sql`select pg_try_advisory_xact_lock(76329845) as acquired`);if(!locked.rows[0]?.acquired)return;
  const due=await tx.select().from(organizationDeletions).where(lte(organizationDeletions.dueAt,new Date())).limit(5);
  for(const d of due){await tx.select().from(organizations).where(eq(organizations.id,d.organizationId)).for('update');
   const [still]=await tx.select().from(organizationDeletions).where(and(eq(organizationDeletions.organizationId,d.organizationId),lte(organizationDeletions.dueAt,new Date())));if(!still)continue;
   const o=d.organizationId;
   await tx.execute(sql`insert into erased_files(key) select storage_key from media where organization_id=${o} and storage_key is not null on conflict do nothing`);
   await tx.execute(sql`insert into erased_files(key) select key from media_parts where media_id in (select id from media where organization_id=${o}) on conflict do nothing`);
   for(const table of ['publications','content_decisions','content_versions'])await tx.execute(sql`delete from ${sql.identifier(table)} where content_id in (select id from contents where organization_id=${o})`);
   for(const table of ['drive_transfers','contents','production_history'])await tx.execute(sql`delete from ${sql.identifier(table)} where organization_id=${o}`);
   await tx.execute(sql`delete from media_parts where media_id in (select id from media where organization_id=${o})`);
   for(const table of ['media','collections'])await tx.execute(sql`delete from ${sql.identifier(table)} where organization_id=${o}`);
   await tx.execute(sql`delete from task_dependencies where task_id in (select id from work_tasks where project_id in (select id from projects where organization_id=${o})) or depends_on_id in (select id from work_tasks where project_id in (select id from projects where organization_id=${o}))`);
   for(const table of ['work_history','work_tasks','pack_applications','pack_previews','programme_changes','project_briefs','occurrences','project_grants'])await tx.execute(sql`delete from ${sql.identifier(table)} where project_id in (select id from projects where organization_id=${o})`);
   for(const table of ['projects','liturgical_dates','jobs','google_calendars','join_requests','join_codes','invitations','access_audit','availabilities','organization_deletions'])await tx.execute(sql`delete from ${sql.identifier(table)} where organization_id=${o}`);
   await tx.execute(sql`delete from project_grants where member_id in (select id from members where organization_id=${o})`);
   await tx.delete(members).where(eq(members.organizationId,o));await tx.delete(organizations).where(eq(organizations.id,o));
  }
  const accounts=await tx.select().from(accountDeletions).where(and(eq(accountDeletions.status,'pending'),lte(accountDeletions.dueAt,new Date()))).limit(10);
  for(const d of accounts){await tx.select().from(user).where(eq(user.id,d.userId)).for('update');const [still]=await tx.select().from(accountDeletions).where(eq(accountDeletions.userId,d.userId));if(!still)continue;
   const active=await tx.select().from(members).where(and(eq(members.userId,d.userId),eq(members.role,'admin'),isNull(members.revokedAt)));if(active.length)continue;
   const [u]=await tx.select().from(user).where(eq(user.id,d.userId));if(!u)continue;
   const ids=(await tx.select().from(members).where(eq(members.userId,d.userId))).map(m=>m.id);
   if(ids.length){await tx.delete(availabilities).where(inArray(availabilities.memberId,ids));await tx.delete(projectGrants).where(inArray(projectGrants.memberId,ids));}
   await tx.update(members).set({revokedAt:new Date(),professions:[],permissions:[]}).where(eq(members.userId,d.userId));
   await tx.delete(googleCalendars).where(eq(googleCalendars.connectedBy,d.userId));
   await tx.update(driveConnections).set({refreshToken:'',status:'disconnected',googleEmail:'',googleSubject:''}).where(eq(driveConnections.connectedBy,d.userId));
   await tx.delete(joinRequests).where(eq(joinRequests.email,u.email));await tx.delete(invitations).where(eq(invitations.email,u.email));
   await tx.delete(session).where(eq(session.userId,d.userId));await tx.delete(account).where(eq(account.userId,d.userId));await tx.delete(verification).where(eq(verification.identifier,u.email));
   // Shared associations explicitly transferred retain contributions without the person's login identity.
   await tx.update(user).set({name:'Compte supprimé',email:`deleted-${randomUUID()}@invalid.example`,image:null,emailVerified:false}).where(eq(user.id,d.userId));
   await tx.delete(accountDeletions).where(eq(accountDeletions.userId,d.userId));
  }
 });
 for(const f of await db.select().from(erasedFiles).limit(50)){try{await remove(f.key);await db.delete(erasedFiles).where(eq(erasedFiles.key,f.key));}catch{console.error('Suppression de fichier à reprendre.');}}
}
