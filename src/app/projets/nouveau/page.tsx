import { randomUUID } from 'node:crypto';
import { programmeContext, MissingSpace } from '../../../modules/programme/context';
import { programmeService } from '../../../modules/programme/service';
import { BriefForm } from './brief-form';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Nouvel événement' };
export default async function Page({ searchParams }: { searchParams: Promise<{ organisation?: string }> }) { const { actor, db, org } = await programmeContext((await searchParams).organisation); if (!org) return <MissingSpace/>; if (!await programmeService(db).canCreate(actor, org.id)) return <section className="card"><h1>Création non autorisée.</h1><p>Demandez la permission de modifier les projets à votre administrateur.</p></section>; const previous=await programmeService(db).list(actor,org.id); const suggestions=[...new Set(previous.map(p=>p.title))].slice(0,30);const types=[...new Set(previous.map(p=>p.eventType).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'fr')); return <BriefForm org={org} suggestions={suggestions} types={types} creationKey={randomUUID()}/>; }
