import Link from 'next/link';
import {programmeContext,MissingSpace} from '../../../modules/programme/context';
import {programmeService} from '../../../modules/programme/service';
import {Uploader} from '../../../components/uploader';
export const dynamic='force-dynamic';export const metadata={title:'Importer des livrables'};
export default async function Page({searchParams}:{searchParams:Promise<{organisation?:string}>}){
 const {actor,db,org}=await programmeContext((await searchParams).organisation);if(!org)return <MissingSpace/>;
 const service=programmeService(db),targets=[];for(const p of (await service.list(actor,org.id)).filter(p=>p.status==='preparation')){const d=await service.get(actor,org.id,p.id);if(d.canEdit)targets.push({id:p.id,title:p.title,events:d.events.filter(e=>e.status!=='cancelled')});}
 return <><section className="page-title"><h1>Importer des livrables</h1><p>Ajoutez les montages, visuels et documents destinés à vos publications. Ils seront classés comme livrables, séparément des rushs.</p></section><Link className="button secondary" href={`/livrables?organisation=${org.id}`}>Contenus et livrables</Link><section className="card section-spaced">{targets.length?<Uploader organizationId={org.id} projects={targets} destination="deliverable"/>:<><h2>Aucun projet disponible pour cet import</h2><p>L’importation de livrables demande un événement en préparation et le droit de le modifier. Un membre standard peut déposer ses photos et vidéos dans Rushs des événements.</p><Link href={`/medias/importer?organisation=${org.id}`}>Importer les rushs d’un événement →</Link></>}</section><p className="notice">La réception dans ComÉternel ne confirme pas une copie dans Google Drive. Le transfert automatique vers Drive reste à finaliser.</p></>;
}
