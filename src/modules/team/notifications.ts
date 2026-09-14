import {and,eq,isNull} from 'drizzle-orm';
import {getDb} from '../../db/client';
import {joinRequests,members} from '../../db/team-schema';
import {organizations} from '../../db/schema';
import {user} from '../../db/auth-schema';
import {sendMail} from '../identity/mail';
export async function notifyJoinRequest(db:ReturnType<typeof getDb>,id:string,send=sendMail){
 const [request]=await db.select({email:joinRequests.email,org:joinRequests.organizationId,name:organizations.name}).from(joinRequests).innerJoin(organizations,eq(organizations.id,joinRequests.organizationId)).where(and(eq(joinRequests.id,id),eq(joinRequests.status,'pending')));
 if(!request)return;
 const admins=await db.select({email:user.email}).from(members).innerJoin(user,eq(user.id,members.userId)).where(and(eq(members.organizationId,request.org),eq(members.role,'admin'),isNull(members.revokedAt),eq(user.emailVerified,true)));
 const link=new URL('/equipe',process.env.BETTER_AUTH_URL);link.searchParams.set('organisation',request.org);link.hash='demandes';
 const results=await Promise.allSettled([...new Set(admins.map(a=>a.email))].map(email=>send(email,'ComÉternel — Nouvelle demande d’accès',`Une personne demande à rejoindre votre association « ${request.name} ».\n\nAdresse déclarée : ${request.email}\nCette adresse devra être vérifiée avant tout accès.\n\nExaminez la demande et choisissez son profil dans ComÉternel :\n${link}\n\nAucun accès n’est accordé automatiquement.`)));
 if(results.some(r=>r.status==='rejected'))throw new Error('join_notification_failed');
}
