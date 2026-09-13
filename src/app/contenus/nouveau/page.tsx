import {randomUUID} from 'node:crypto';
import Link from 'next/link';
import {programmeContext,MissingSpace} from '../../../modules/programme/context';
import {programmeService} from '../../../modules/programme/service';
import {mediaService} from '../../../modules/production/media-service';
import {ProductionForm} from '../../../components/production-form';
import {ContentFields} from '../../../components/content-fields';
export const dynamic='force-dynamic';export const metadata={title:'Nouveau contenu'};
export default async function Page({searchParams}:{searchParams:Promise<{organisation?:string;projet?:string}>}){const q=await searchParams;const {actor,db,org}=await programmeContext(q.organisation);if(!org)return <MissingSpace/>;const s=programmeService(db),ps=await s.list(actor,org.id);const id=q.projet||ps.find(p=>p.status==='preparation')?.id;let d;try{d=id?await s.get(actor,org.id,id):null;}catch{return <MissingSpace/>;}return <><section className="page-title"><h1>Créer un contenu</h1></section><nav className="quick-actions">{ps.filter(p=>p.status==='preparation').map(p=><Link key={p.id} className="button secondary" href={`/contenus/nouveau?organisation=${org.id}&projet=${p.id}`}>{p.title}</Link>)}</nav>{d?.canEdit?<section className="card"><h2>{d.project.title}</h2><ProductionForm fields={{operation:'save',organizationId:org.id,projectId:d.project.id,creationKey:randomUUID()}}><ContentFields assets={(await mediaService(db).list(actor,org.id)).media.filter(m=>m.projectId===d.project.id)} events={d.events}/><button>Créer le brouillon</button></ProductionForm></section>:<section className="card"><p>Choisissez un projet que vous pouvez modifier, ou créez-en un.</p><Link href={`/projets/nouveau?organisation=${org.id}`}>Créer un projet</Link></section>}</>;}
