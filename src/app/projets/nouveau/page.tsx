import { randomUUID } from 'node:crypto';
import { programmeContext, MissingSpace } from '../../../modules/programme/context';
import { teamService } from '../../../modules/team/service';
import { programmeService } from '../../../modules/programme/service';
import { BriefForm } from './brief-form';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Nouveau projet' };
export default async function Page({ searchParams }: { searchParams: Promise<{ organisation?: string }> }) { const { actor, db, org } = await programmeContext((await searchParams).organisation); if (!org) return <MissingSpace/>; if (!await programmeService(db).canCreate(actor, org.id)) return <section className="card"><h1>Création non autorisée.</h1><p>Demandez la permission de modifier les projets à votre administrateur.</p></section>; const people = (await teamService(db).listMembers(actor, org.id)).filter(p => !p.revokedAt); return <BriefForm org={org} people={people} creationKey={randomUUID()}/>; }
