import {eq} from 'drizzle-orm';
import {getDb} from '../../db/client';
import {accessAudit} from '../../db/team-schema';
import {organizations} from '../../db/schema';
import {sendMail} from '../identity/mail';
export async function deliverInvitation(db:ReturnType<typeof getDb>,actorId:string,orgId:string,invitation:{id:string;email:string;token:string},send=sendMail){
 const [org]=await db.select({name:organizations.name}).from(organizations).where(eq(organizations.id,orgId));
 if(!org)throw new Error('Association indisponible');
 const url=new URL('/invitations',process.env.BETTER_AUTH_URL);url.searchParams.set('token',invitation.token);
 let delivered=false;
 try{await send(invitation.email,`ComÉternel — Invitation à rejoindre ${org.name.replace(/[\r\n]/g,' ')}`,`Vous êtes invité à rejoindre « ${org.name} » sur ComÉternel.\n\n1. Ouvrez ce lien :\n${url}\n\n2. Connectez-vous ou créez votre compte avec ${invitation.email}.\n3. Acceptez l’invitation pour accéder à votre équipe.\n\nVotre code personnel : ${invitation.token}\nLe lien et le code sont valables 48 heures et utilisables une seule fois.\n\nSi vous n’attendiez pas cette invitation, ignorez ce message.`);delivered=true;}catch{}
 await db.insert(accessAudit).values({organizationId:orgId,actorId,action:delivered?'invitation.email_sent':'invitation.email_failed',targetId:invitation.id});
 return delivered;
}
