import Link from 'next/link';
import {randomUUID} from 'node:crypto';
import {programmeContext,MissingSpace} from '../../../modules/programme/context';
import {workService} from '../../../modules/work/service';
import {WorkForm} from '../../../components/work-form';
import {TaskFields} from '../../../components/work-fields';
export const dynamic='force-dynamic';
export default async function Page({searchParams}:{searchParams:Promise<{organisation?:string;projet?:string}>}){
 const q=await searchParams,{actor,db,org}=await programmeContext(q.organisation);if(!org)return <MissingSpace/>;
 const s=workService(db),base=await s.list(actor,org.id);
 const available=(await Promise.all(base.projects.filter(p=>p.status==='preparation').map(p=>s.get(actor,org.id,p.id)))).filter(d=>d.canEdit);
 const selected=available.find(d=>d.project.id===q.projet);
 return <><section className="page-title"><p className="eyebrow">TÂCHES · {org.name}</p><h1>Ajouter une tâche</h1><p>Choisissez le projet, indiquez le travail à faire, sa date et la personne à qui proposer la mission.</p></section><Link href={`/taches?organisation=${org.id}`}>← Revenir aux tâches</Link><form className="card section-spaced"><input type="hidden" name="organisation" value={org.id}/><label>Projet<select name="projet" required defaultValue={q.projet||''}><option value="" disabled>Choisir un projet</option>{available.map(d=><option key={d.project.id} value={d.project.id}>{d.project.title}</option>)}</select></label><button>Continuer</button>{!available.length&&<p>Aucun projet modifiable. Créez un projet ou demandez son accès à votre administrateur.</p>}</form>{selected&&(selected.brief.status==='accepted'?<section className="card section-spaced"><h2>{selected.project.title}</h2><WorkForm fields={{operation:'create',organizationId:org.id,projectId:selected.project.id,key:randomUUID(),reason:'Ajout depuis la liste des tâches'}}>{selected.project.kind==='event'&&<label>Date de l’événement<select name="occurrenceId" required>{selected.events.filter(e=>e.status!=='cancelled').map(e=><option key={e.id} value={e.id}>{e.startDate}</option>)}</select></label>}<TaskFields people={selected.candidates}/><button>Créer la tâche</button></WorkForm></section>:<section className="card section-spaced"><h2>Ce projet attend une décision</h2><p>La demande du projet doit être acceptée avant de distribuer les tâches.</p><Link className="button" href={`/projets/${selected.project.id}/travail?organisation=${org.id}`}>Ouvrir la demande du projet</Link></section>)}</>;
}
