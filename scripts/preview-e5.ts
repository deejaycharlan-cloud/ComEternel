// Recette visuelle isolée : aucune donnée de l'application habituelle n'est modifiée.
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { Pool } from 'pg';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { getDb } from '../src/db/client';
import { createAuth } from '../src/modules/identity/auth';
import { teamService } from '../src/modules/team/service';
import { programmeService } from '../src/modules/programme/service';
import { user } from '../src/db/auth-schema';
const source=new URL(process.env.TEST_DATABASE_URL||'');
if(!source.pathname.endsWith('_test')||!['127.0.0.1','localhost'].includes(source.hostname))throw new Error('Base de test locale requise');
const admin=new Pool({connectionString:source.toString()});
if(!(await admin.query("SELECT 1 FROM pg_database WHERE datname='cometernel_ui_test'")).rowCount)await admin.query('CREATE DATABASE cometernel_ui_test');
await admin.end();source.pathname='/cometernel_ui_test';process.env.DATABASE_URL=source.toString();process.env.PRIVATE_STORAGE_PATH='.private-media-ui';process.env.STORAGE_DRIVER='local';process.env.BETTER_AUTH_URL='http://localhost:3101';
const db=getDb();await migrate(db,{migrationsFolder:'./drizzle'});
if (!process.argv.includes('--serve-only')) {
const id=randomUUID(),email=`recette-${id}@test.invalid`;
await db.insert(user).values({id,email,emailVerified:true,name:'Recette E5'});
const actor={user:{id,email,emailVerified:true},session:{createdAt:new Date()}};
const org=await teamService(db).createOrganization(actor,{name:'RECETTE E5 — données fictives',timezone:'America/Martinique'});
const p=await programmeService(db).create(actor,org.id,{creationKey:randomUUID(),title:'RECETTE — rencontre de bénévoles',kind:'event',eventType:'Rencontre',ministry:'',location:'Salle de test',practicalInfo:'Données fictives',ownerId:'',validatorId:'',deputyId:'',decisionMakerId:'',communicationLevel:'essential',timezone:'America/Martinique',startDate:'2090-09-15',endDate:'2090-09-15',allDay:true,startTime:null,endTime:null,cadence:'none',occurrenceCount:1,objective:'Vérifier le parcours de préparation',audience:'Bénévoles fictifs',message:'Recette visuelle complète du travail',resources:'Ressources de test',usefulDate:''});
const auth=createAuth(db,async(_email,_subject,body)=>{console.log(body.split('\n').find(s=>s.startsWith('http')));});
await auth.api.signInMagicLink({headers:new Headers({origin:process.env.BETTER_AUTH_URL}),body:{email,callbackURL:`/projets/${p.id}/travail?organisation=${org.id}`}});
}
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3101'],{stdio:'inherit',env:process.env});
process.on('SIGINT',()=>{child.kill('SIGINT');process.exit(0);});
