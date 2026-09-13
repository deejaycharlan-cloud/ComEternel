'use server';
import {sql} from 'drizzle-orm';
import {getDb} from '../../../db/client';
import {currentSession} from '../../../modules/identity/session';
import {teamService} from '../../../modules/team/service';
import {sendMail} from '../../../modules/identity/mail';
export async function testEmail(){try{const a=await currentSession();if(!a?.user.emailVerified||!(await teamService(getDb()).listOrganizations(a)).some(s=>s.role==='admin'))return {message:'Connectez-vous avec un compte administrateur.'};const key=`email-test:${a.user.id}`;const r=await getDb().execute(sql`insert into request_limits(key,count,expires_at) values(${key},1,now()+interval '1 minute') on conflict(key) do update set count=1,expires_at=now()+interval '1 minute' where request_limits.expires_at<now() returning key`);if(!r.rowCount)return {message:'Attendez une minute avant un nouvel essai.'};await sendMail(a.user.email,'ComÉternel — test de connexion email','Ce message confirme un essai d’envoi depuis votre application ComÉternel. Aucune action n’est nécessaire.');return {message:'Email accepté par le service d’envoi. Vérifiez votre boîte de réception et les indésirables.'};}catch{return {message:'Envoi non confirmé. Vérifiez la clé SMTP et l’activation des emails transactionnels dans Brevo.'};}}
