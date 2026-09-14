import {ShareLink} from '../../components/share-link';
import Link from 'next/link';
import {redirect} from 'next/navigation';
import {and,eq,desc} from 'drizzle-orm';
import {requireSession} from '../../modules/identity/session';
import {teamService,requireTeamSession} from '../../modules/team/service';
import {getDb} from '../../db/client';
import {accessAudit} from '../../db/team-schema';
import {mailConfig} from '../../config/deployment';
import {Badge} from '../../components/ui/badge';
import {TeamForm} from './team-form';
import {profiles,type Profile} from '../../modules/preview/data';
export const dynamic='force-dynamic';
export const metadata={title:'Membres et invitations'};
export default async function Page({searchParams}:{searchParams:Promise<{organisation?:string}>}){
 const actor=await requireSession(),db=getDb(),service=teamService(db),spaces=await service.listOrganizations(actor),requested=(await searchParams).organisation;
 const org=requested?spaces.find(s=>s.id===requested):spaces[0];
 if(!org)return <section className="card"><h1>Choisissez votre association</h1><Link href="/compte">Revenir à mon compte</Link></section>;
 if(org.role!=='admin')redirect(`/?organisation=${org.id}`);
 const [people,invites,requests,joinCode,audit]=await Promise.all([service.listMembers(actor,org.id),service.listInvitations(actor,org.id),service.listJoinRequests(actor,org.id),service.getJoinCode(actor,org.id),db.select().from(accessAudit).where(eq(accessAudit.organizationId,org.id)).orderBy(desc(accessAudit.createdAt))]);
 let fresh=true;try{requireTeamSession(actor);}catch{fresh=false;}
 let sender='Service email non configuré';try{sender=mailConfig().from;}catch{}
 const sentState=(id:string)=>audit.find(a=>a.targetId===id&&['invitation.email_sent','invitation.email_failed','invitation.resent'].includes(a.action))?.action;
 const returnTo=`/equipe?organisation=${org.id}`;
 const reconnect=`/connexion?retour=${encodeURIComponent(returnTo)}`;
 const active=people.filter(p=>!p.revokedAt);
 return <><section className="page-title"><p className="eyebrow">{org.name}</p><h1>Membres et invitations</h1><p>Invitez votre équipe, examinez les demandes et suivez les accès.</p></section>
 <nav className="quick-actions" aria-label="Gestion de l’équipe"><a className="button" href="#inviter">Inviter un membre</a><a className="button secondary" href="#demandes">Demandes ({requests.length})</a><a className="button secondary" href="#invitations">Invitations</a><a className="button secondary" href="#membres">Membres ({active.length})</a></nav>
 {!fresh&&<section className="notice" role="status"><strong>Confirmez votre identité pour gérer les accès.</strong><p>Votre session permet de consulter cette page. Pour inviter, accepter une demande ou modifier un rôle, reconnectez-vous. Vous reviendrez directement ici.</p><Link className="button" href={reconnect}>Confirmer mon identité</Link></section>}
 <section className="card section-spaced"><h2>Où sont envoyés les emails ?</h2><p>Les alertes de nouvelles demandes sont adressées aux administrateurs actifs de cette association : <strong>{active.filter(p=>p.role==='admin').map(p=>p.email).join(', ')}</strong>.</p><p>Chaque invitation est envoyée à l’adresse de la personne invitée. Expéditeur : <strong>{sender}</strong>.</p><p className="hint">« Email accepté par le service d’envoi » ne garantit pas sa réception. Le destinataire peut vérifier ses indésirables.</p></section>
 <section className="card section-spaced" id="demandes"><h2>Demandes d’accès <Badge>{requests.length}</Badge></h2><p>Choisissez les droits de la personne, puis validez l’envoi de son invitation. Elle ne devient membre qu’après l’avoir acceptée.</p>{!requests.length?<p>Aucune demande en attente.</p>:<ul className="item-list">{requests.map(r=><li key={r.id}><strong>{r.email}</strong><p>Reçue le {r.createdAt.toLocaleDateString('fr-FR',{timeZone:org.timezone})}</p><details><summary>Examiner et choisir les droits</summary><TeamForm organizationId={org.id} operation="approve-join" id={r.id} locked={!fresh}/></details><TeamForm organizationId={org.id} operation="reject-join" id={r.id} locked={!fresh}/></li>)}</ul>}<details><summary>Partager un lien pour demander à rejoindre</summary><p>Ce code permet uniquement de demander à rejoindre l’association. Il n’accorde aucun accès.</p><ShareLink path={`/connexion?association=${joinCode}#rejoindre`}/><p>Avec ce lien, la personne renseigne seulement son email. Vous choisissez ensuite ses droits et lui envoyez son invitation.</p><details><summary>Afficher le code à saisir manuellement</summary><strong>{joinCode}</strong></details></details></section>
 <section className="card section-spaced" id="inviter"><h2>Inviter un membre</h2><p>Indiquez son adresse email, puis choisissez un envoi par email ou un code personnel à transmettre. L’invitation est valable 48 heures.</p><TeamForm organizationId={org.id} operation="invite" locked={!fresh}/></section>
 <section className="card section-spaced" id="invitations"><h2>Suivi des invitations</h2>{!invites.length?<p>Aucune invitation créée.</p>:<ul className="item-list">{invites.map(i=>{const delivery=sentState(i.id),expired=i.expiresAt<new Date();return <li key={i.id}><strong>{i.email}</strong><p><Badge tone={i.acceptedAt?'success':delivery==='invitation.email_failed'?'warning':'neutral'}>{i.acceptedAt?'Invitation acceptée':i.revokedAt?'Invitation annulée':expired?'Invitation expirée':'En attente d’acceptation'}</Badge></p>{!i.acceptedAt&&!i.revokedAt&&<><p>{delivery==='invitation.email_failed'?'Échec d’envoi : renvoyez l’email.':delivery==='invitation.email_sent'?'Email accepté par le service d’envoi.':delivery==='invitation.resent'?'Nouvelle invitation préparée ; envoi non confirmé.':'Envoi email non confirmé ou code partagé manuellement.'}</p><p>Expiration : {i.expiresAt.toLocaleString('fr-FR',{timeZone:org.timezone})}</p><TeamForm organizationId={org.id} operation="resend-invitation" id={i.id} locked={!fresh}/><TeamForm organizationId={org.id} operation="revoke-invitation" id={i.id} locked={!fresh}/></>}</li>;})}</ul>}<p className="hint">Renvoyer un email remplace l’ancien lien et renouvelle sa validité de 48 heures.</p></section>
 <section className="card section-spaced" id="membres"><h2>Membres de l’association <Badge>{active.length}</Badge></h2><ul className="item-list">{active.map(p=><li key={p.id}><strong>{p.name||p.email}</strong><span>{p.email}</span><Badge>{p.role==='admin'?'Administrateur':'Membre'}</Badge><p>{p.professions.map(x=>profiles[x as Profile]?.label||x).join(', ')||'Aucun profil métier attribué'}</p><details><summary>Modifier les droits</summary><TeamForm organizationId={org.id} operation="update-member" id={p.id} initial={p} locked={!fresh}/></details><details><summary>Retirer ce membre</summary><TeamForm organizationId={org.id} operation="remove-member" id={p.id} locked={!fresh}/></details></li>)}</ul></section></>;
}
