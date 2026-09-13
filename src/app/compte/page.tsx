import {canCreateTeam} from '../../config/owner';
import Link from 'next/link';
import { requireSession } from '../../modules/identity/session';
import { teamService } from '../../modules/team/service';
import { getDb } from '../../db/client';
import { Badge } from '../../components/ui/badge';
import { SignOut } from './account-controls';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mon compte' };
export default async function Account() { const actor = await requireSession(); const spaces = await teamService(getDb()).listOrganizations(actor); return <><section className="page-title"><p className="eyebrow">MON COMPTE</p><h1>Votre place dans l’équipe.</h1><p>Connecté avec {actor.user.email}</p></section><div className="grid"><section className="card"><h2>Mes associations</h2>{spaces.length ? <ul className="item-list">{spaces.map(space => <li key={space.id}><Link href={`/equipe?organisation=${space.id}`}>{space.name}</Link><Badge>{space.role === 'admin' ? 'Administrateur' : 'Membre'}</Badge></li>)}</ul> : <p>Aucun espace accessible pour le moment. Demandez une invitation au responsable de votre équipe, puis acceptez-la avec cette adresse.</p>}{(spaces.some(s=>s.role==='admin')||canCreateTeam(actor.user))&&<Link className="button secondary" href="/reglages">Réglages de mes équipes</Link>}<p><Link href="/invitations">Accepter une invitation →</Link></p></section><section className="card"><h2>Sécurité du compte</h2><p>Les sessions durent au maximum un jour. Les changements d’accès et les invitations demandent une connexion de moins de cinq minutes.</p><Link href="/connexion">Confirmer mon identité à nouveau →</Link><p>Les comptes Google et email ne sont pas fusionnés automatiquement.</p><SignOut/></section></div></>; }
