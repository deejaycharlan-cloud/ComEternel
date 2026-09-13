import {canCreateTeam} from '../../config/owner';
import Link from 'next/link';
import { requireSession } from '../../modules/identity/session';
import { teamService } from '../../modules/team/service';
import { getDb } from '../../db/client';
import { Badge } from '../../components/ui/badge';
import { SignOut } from './account-controls';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mon compte' };
export default async function Account() { const actor = await requireSession(); const spaces = await teamService(getDb()).listOrganizations(actor); return <><section className="page-title"><p className="eyebrow">MON COMPTE</p><h1>Mon compte</h1><p>Connecté avec {actor.user.email}</p><SignOut/></section><div className="grid"><section className="card"><h2>Mes associations</h2>{spaces.length ? <ul className="item-list">{spaces.map(space => <li key={space.id}><Link href={`/?organisation=${space.id}`}>{space.name}</Link><Badge>{space.role === 'admin' ? 'Administrateur' : 'Membre'}</Badge></li>)}</ul> : <p>Vous représentez une association ? Créez son espace pour en devenir administrateur. Si vous êtes invité, acceptez l’invitation avec cette adresse.</p>}{canCreateTeam(actor.user)&&<Link className="button" href="/reglages?nouvelle=1">Créer mon association</Link>}{spaces.some(s=>s.role==='admin')&&<Link className="button secondary" href="/reglages">Réglages de mes associations</Link>}<p><Link href="/invitations">Accepter une invitation →</Link></p></section><section className="card"><h2>Quitter ComÉternel</h2><p>Suppression dans 30 jours, avec annulation ou transfert de l’association avant l’échéance.</p><Link className="button secondary" href="/compte/suppression">Supprimer mon compte</Link></section></div></>; }
