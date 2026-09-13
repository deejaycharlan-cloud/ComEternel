import {canCreateTeam} from '../../config/owner';
import {Badge} from '../../components/ui/badge';
import {getDb} from '../../db/client';
import {requireSession} from '../../modules/identity/session';
import {teamService} from '../../modules/team/service';
import {driveConfig} from '../../modules/integrations/drive-transfers';
import {SetupForm} from '../setup-form';
import Link from 'next/link';
export const dynamic='force-dynamic';
export const metadata={title:'Réglages de l’équipe'};
export default async function Settings({searchParams}:{searchParams:Promise<{organisation?:string}>}){
 const actor=await requireSession();const spaces=await teamService(getDb()).listOrganizations(actor);const requested=(await searchParams).organisation;const admins=spaces.filter(s=>s.role==='admin');const selected=requested?admins.find(s=>s.id===requested):admins[0];
 if(!selected && canCreateTeam(actor.user))return <section className="card"><h1>Créer votre équipe</h1><p>Vous en serez l’administrateur initial. Vous pourrez ensuite inviter les membres par email.</p><SetupForm/></section>;
 if(!selected)return <section className="card"><h1>Les réglages sont réservés aux responsables.</h1><p>Votre compte permet de consulter les équipes qui vous ont invité. Pour modifier les réglages d’une équipe, contactez son administrateur.</p><Link className="button secondary" href="/compte">Mon compte</Link></section>;
 const configured=driveConfig()?.organizationId===selected.id;
 return <><section className="page-title"><p className="eyebrow">ADMINISTRATION · {selected.name}</p><h1>Les réglages de votre équipe.</h1><p>Gérez les accès et les services de l’association dont vous êtes responsable.</p></section><div className="grid"><section className="card"><h2>Mes équipes à administrer</h2><ul className="spaces">{admins.map(space=><li key={space.id}><strong>{space.name}</strong><span>{space.timezone}</span><Link href={`/equipe?organisation=${space.id}`}>Membres et invitations →</Link><p><Link href={`/exploitation?organisation=${space.id}`}>Connexions et suivi →</Link></p></li>)}</ul>{canCreateTeam(actor.user)&&<details><summary>Créer une autre équipe</summary><SetupForm/></details>}</section><section className="card"><h2>Services et accès</h2><ul className="item-list"><li><strong>Comptes et invitations</strong><Badge tone="success">Disponible</Badge></li><li><strong>Google Drive avec n8n</strong><Badge tone={configured?'info':'warning'}>{configured?'Paramètres renseignés · Test à confirmer':'À configurer'}</Badge></li>{['Google Calendar','Emails externes'].map(service=><li key={service}><strong>{service}</strong><Badge>Non activé</Badge></li>)}</ul><p><Link href={`/exploitation?organisation=${selected.id}`}>Configurer et suivre les services →</Link></p><p><Link href="/compte">Mon compte et ma connexion →</Link></p><p>La connexion Google personnelle reste distincte du Drive utilisé pour les fichiers de l’équipe.</p></section></div></>;
}
