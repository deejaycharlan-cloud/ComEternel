import Link from 'next/link';
import { InvitationForm } from './invitation-form';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Accepter une invitation', referrer: 'no-referrer' as const };
export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) { const token = (await searchParams).token || ''; return <section className="card"><h1>Rejoindre votre équipe.</h1><p>Connectez-vous avec l’adresse destinataire de l’invitation, puis revenez sur ce lien. Rien n’est accepté automatiquement.</p><Link href="/connexion">Me connecter →</Link><InvitationForm initialToken={/^[\w-]{43}$/.test(token) ? token : ''}/></section>; }
