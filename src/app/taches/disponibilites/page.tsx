import {programmeContext,MissingSpace} from '../../../modules/programme/context';
import {workService} from '../../../modules/work/service';
import {WorkForm} from '../../../components/work-form';
import {TaskTabs} from '../../../components/task-tabs';
export const dynamic='force-dynamic';
export const metadata={title:'Mes disponibilités'};
export default async function Page({searchParams}:{searchParams:Promise<{organisation?:string}>}) {
 const {actor,db,org}=await programmeContext((await searchParams).organisation);if(!org)return <MissingSpace/>;
 const d=await workService(db).list(actor,org.id);
 return <><section className="page-title"><h1>Mes disponibilités</h1><p>Indiquez quand vous pouvez participer pour aider l’équipe à répartir les missions.</p></section><TaskTabs organizationId={org.id} active="availability"/><section id="disponibilites" className="card section-spaced"><h2>Déclarer une période</h2><p>Déclarez une période utile à l’organisation, sans justification personnelle obligatoire.</p><WorkForm key={`availability-${d.availability.length}`} fields={{operation:'availability',organizationId:org.id}}><div className="field-grid"><label>Du<input name="startDate" type="date" required/></label><label>Au<input name="endDate" type="date" required/></label></div><label>Disponibilité<select name="capacity"><option value="available">Disponible</option><option value="limited">Disponibilité limitée</option><option value="unavailable">Indisponible</option></select></label><label>Précisions facultatives<input name="note" maxLength={500}/></label><button>Ajouter cette période</button></WorkForm><h2 className="section-spaced">Mes périodes déclarées</h2>{!d.availability.length&&<p>Aucune période déclarée pour le moment.</p>}<ul className="item-list">{d.availability.map(v=><li key={v.id}><span>{v.startDate} → {v.endDate} · {{available:'Disponible',limited:'Disponibilité limitée',unavailable:'Indisponible'}[v.capacity]} · {v.note}</span><WorkForm fields={{operation:'removeAvailability',organizationId:org.id,id:v.id}}><button className="secondary">Retirer ma déclaration</button></WorkForm></li>)}</ul></section></>;
}
