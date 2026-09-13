'use server';
import {currentSession} from '../../modules/identity/session';
import {getDb} from '../../db/client';
import {contentService} from '../../modules/production/content-service';
import {mediaService} from '../../modules/production/media-service';
import {ProductionError} from '../../modules/production/access';
import {AccessError} from '../../modules/team/service';
import {revalidatePath} from 'next/cache';
import {z} from 'zod';
import {driveConfig,driveTransferService} from '../../modules/integrations/drive-transfers';
export type State={status:'idle'|'success'|'error';message:string;href?:string};
export async function productionAction(_:State,form:FormData):Promise<State>{const g=(k:string)=>String(form.get(k)||'');try{const a=await currentSession();if(!a)throw new AccessError();const db=getDb(),cs=contentService(db),ms=mediaService(db),org=g('organizationId'),p=g('projectId'),id=g('id'),revision=Number(g('revision'));let href:string|undefined;const rights=()=>({author:g('author'),people:g('people'),music:g('music'),minors:g('minors'),channels:g('channels').split(',').map(s=>s.trim()).filter(Boolean),evidence:g('evidence'),reviewDate:g('reviewDate'),reviewer:g('reviewer'),withdrawn:g('withdrawn')==='on'});
 switch(g('operation')){
 case 'drive-transfer':{const config=driveConfig();if(!config||config.organizationId!==org)throw new ProductionError('Connexion Drive et n8n à configurer pour cette équipe.');await driveTransferService(db,config).enqueue(a,id);break;}
 case 'save':{const item=await cs.save(a,org,p,g('creationKey'),{title:g('title'),channel:g('channel'),format:g('format'),plannedDate:g('plannedDate'),occurrenceId:g('occurrenceId')||null,caption:g('caption'),brief:g('brief'),practicalUrl:g('practicalUrl'),creationUrl:g('creationUrl'),reference:g('reference'),mediaIds:form.getAll('mediaIds').map(String),rights:g('author')?rights():null},id||undefined,revision);href=`/contenus/${item.id}?organisation=${org}`;break;}
 case 'submit':await cs.submit(a,org,id,revision);break;
 case 'decide':await cs.decide(a,org,id,revision,g('decision'),g('reason'));break;
 case 'prepare':await cs.prepare(a,org,id,revision,g('responseOwner'));break;
 case 'publish':await cs.publish(a,org,id,g('proof'),g('publishedAt'));break;
 case 'withdraw':await cs.withdraw(a,org,id,g('reason'));break;
 case 'rights':await cs.rights(a,org,id,revision,rights());break;
 case 'review':await ms.review(a,org,id,revision,g('decision')==='approve',g('reason'));break;
 case 'proposal':await ms.proposal(a,org,id,g('target')||null,g('reason'));break;
 case 'collection':{const c=await ms.createCollection(a,org,p,{title:g('title'),instructions:g('instructions'),expiresAt:g('expiresAt'),maxFiles:Number(g('maxFiles')),maxBytes:Number(g('maxMB'))*1024*1024,code:g('code'),allowProposal:g('allowProposal')==='on',occurrenceId:g('occurrenceId')||null});href=`/collectes/${c.token}`;break;}
 case 'revoke':await ms.revoke(a,org,id);break;
 default:throw new AccessError();}
 revalidatePath('/', 'layout');return {status:'success',message:'Enregistrement confirmé.',href};
 }catch(e){return {status:'error',message:e instanceof AccessError||e instanceof ProductionError?e.message:e instanceof z.ZodError?'Vérifiez les champs, les dates et les informations obligatoires.':'Enregistrement impossible. Vos saisies restent disponibles.'};}}
