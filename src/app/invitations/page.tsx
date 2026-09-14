import Link from 'next/link';
import {currentSession} from '../../modules/identity/session';
import {InvitationForm} from './invitation-form';
export const dynamic='force-dynamic';
export const metadata={title:'Rejoindre votre équipe',robots:{index:false,follow:false}};
export default async function Page({searchParams}:{searchParams:Promise<{token?:string}>}) {
 const value=(await searchParams).token||'',token=/^[\w-]{43}$/.test(value)?value:'';
 const actor=await currentSession();
 const retour=token?`/invitations?token=${token}`:'/invitations';
 return <section className="card"><h1>Rejoindre votre équipe</h1>{actor?<><p>Vous êtes connecté avec {actor.user.email}. Cette adresse doit correspondre à celle qui a reçu l’invitation.</p><InvitationForm initialToken={token}/></>:<><p>Connectez-vous ou créez votre compte avec l’adresse qui a reçu l’invitation. Vous reviendrez ici pour accepter et entrer dans votre équipe.</p><Link className="button" href={`/connexion?retour=${encodeURIComponent(retour)}`}>Continuer avec Google ou mon email</Link><p>Aucun espace d’association à créer : vous rejoindrez celui de votre équipe.</p></>}</section>;
}
