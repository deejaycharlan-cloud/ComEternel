import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {Pool} from 'pg';
import {drizzle} from 'drizzle-orm/node-postgres';
import {eq} from 'drizzle-orm';
import {organizations} from '../../src/db/schema';
import {user} from '../../src/db/auth-schema';
import {members,joinRequests,projectGrants} from '../../src/db/team-schema';
import {projects} from '../../src/db/programme-schema';
import {workspaceSummary} from '../../src/modules/team/workspace-summary';
const url=process.env.TEST_DATABASE_URL;
if(!url||!new URL(url).pathname.endsWith('_test')||url===process.env.DATABASE_URL)throw new Error('Base de test dédiée requise');
test('Menu en une requête : isolation des comptes, droits ciblés et révocation immédiate',async()=>{
 const pool=new Pool({connectionString:url});let queries=0;const db=drizzle(pool,{logger:{logQuery(){queries++;}}});const rollback=new Error('Test terminé : annuler les données fictives');
 try{await assert.rejects(db.transaction(async tx=>{
  const a=randomUUID(),b=randomUUID(),o=randomUUID(),foreign=randomUUID(),mid=randomUUID(),pid=randomUUID();
  await tx.insert(user).values([{id:a,name:'TEST A',email:`${a}@test.invalid`,emailVerified:true},{id:b,name:'TEST B',email:`${b}@test.invalid`,emailVerified:true}]);
  await tx.insert(organizations).values([{id:o,name:'TEST A',timezone:'UTC'},{id:foreign,name:'TEST B',timezone:'UTC'}]);
  await tx.insert(members).values([{organizationId:o,userId:a,role:'admin'},{id:mid,organizationId:o,userId:b,role:'member',permissions:[]},{organizationId:foreign,userId:b,role:'admin'}]);
  await tx.insert(joinRequests).values({organizationId:o,email:'request@test.invalid'});
  await tx.insert(projects).values({id:pid,organizationId:o,createdBy:a,creationKey:randomUUID(),inputHash:'test',title:'TEST projet',kind:'event',eventType:'Rencontre',communicationLevel:'essential',timezone:'UTC',startDate:'2090-01-01',endDate:'2090-01-01',allDay:true,cadence:'none',occurrenceCount:1});
  const actor=(id:string)=>({user:{id,email:`${id}@test.invalid`,emailVerified:true},session:{createdAt:new Date()}});
  const before=queries;const rows=await workspaceSummary(tx,actor(a));assert.equal(queries-before,1);assert.equal(rows.length,1);assert.equal(rows[0].id,o);assert.equal(rows[0].pendingRequests,1);assert.equal(rows[0].canRead,true);assert.equal(rows[0].canCreate,true);
  let member=(await workspaceSummary(tx,actor(b))).find(r=>r.id===o)!;assert.equal(member.pendingRequests,0);assert.equal(member.canRead,false);assert.equal(member.canCreate,false);
  await tx.update(members).set({permissions:['project.read']}).where(eq(members.id,mid));
  member=(await workspaceSummary(tx,actor(b))).find(r=>r.id===o)!;assert.equal(member.canRead,false);
  await tx.insert(projectGrants).values({memberId:mid,projectId:pid,permission:'project.read'});
  member=(await workspaceSummary(tx,actor(b))).find(r=>r.id===o)!;assert.equal(member.canRead,true);assert.equal(member.canCreate,false);
  await tx.update(members).set({revokedAt:new Date()}).where(eq(members.id,mid));assert.deepEqual((await workspaceSummary(tx,actor(b))).map(r=>r.id),[foreign]);
  await assert.rejects(workspaceSummary(tx,{...actor(a),user:{...actor(a).user,emailVerified:false}}));
  throw rollback;
 }),error=>error===rollback);}finally{await pool.end();}
});
