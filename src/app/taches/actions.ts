'use server';
import { currentSession } from '../../modules/identity/session';
import { getDb } from '../../db/client';
import { workService, WorkError } from '../../modules/work/service';
import { AccessError } from '../../modules/team/service';
import type { RequestStatus, TaskStatus } from '../../modules/work/models';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
export type WorkState={status:'idle'|'success'|'error';message:string;href?:string};
export async function workAction(_:WorkState,form:FormData):Promise<WorkState>{
 const g=(key:string)=>String(form.get(key)||'');const person=(key:string)=>g(key)||null;
 try{const a=await currentSession();if(!a)throw new AccessError('Reconnectez-vous pour enregistrer.');const s=workService(getDb()),org=g('organizationId'),p=g('projectId'),id=g('taskId'),rev=Number(g('revision')),op=g('operation');let href=p?`/projets/${p}/travail?organisation=${org}`:`/taches?organisation=${org}`;
 const row=(prefix='')=>({key:g(`${prefix}key`),title:g(`${prefix}title`),description:g(`${prefix}description`),format:g(`${prefix}format`),dueDate:g(`${prefix}dueDate`),assigneeId:person(`${prefix}assigneeId`),deputyId:person(`${prefix}deputyId`)});
 if(op==='decide')await s.decide(a,org,p,rev,g('status') as RequestStatus,g('reason'));
 else if(op==='preview'){const v=await s.preview(a,org,p,g('pack'),person('occurrenceId'),g('shift')==='yes');href=`/packs/${v.id}?organisation=${org}`;}
 else if(op==='apply'){const rows=form.getAll('selected').map(String).map(key=>row(`${key}.`));await s.apply(a,org,g('previewId'),rows,g('lateReason'));}
 else if(op==='create'){const t=await s.createTask(a,org,p,person('occurrenceId'),row(),g('reason'));href=`/taches/${t.id}?organisation=${org}&projet=${p}&creation=ok`;}
 else if(op==='mission')await s.mission(a,org,p,id,rev,g('answer')==='accept',g('reason'));
 else if(op==='status')await s.status(a,org,p,id,rev,g('status') as TaskStatus,g('reason'));
 else if(op==='edit')await s.edit(a,org,p,id,rev,row(),g('priority'),form.getAll('dependencies').map(String),g('reason'));
 else if(op==='availability')await s.availability(a,org,{startDate:g('startDate'),endDate:g('endDate'),capacity:g('capacity'),note:g('note')});
 else if(op==='removeAvailability')await s.removeAvailability(a,org,g('id'));else throw new AccessError();
 for(const path of ['/','/taches',`/taches/${id}`,`/projets/${p}`,`/projets/${p}/travail`])revalidatePath(path);
 return {status:'success',message:op==='create'?'Tâche créée. Ouverture de sa fiche…':op==='preview'?'Aperçu prêt. Ouvrez-le pour vérifier les tâches avant application.':'Enregistrement confirmé.',href};
 }catch(e){return {status:'error',message:e instanceof WorkError||e instanceof AccessError?e.message:e instanceof z.ZodError?'Vérifiez les champs obligatoires et les dates. Lorsqu’une explication est demandée, saisissez au moins 5 caractères.':'Enregistrement impossible. Vos saisies sont conservées.'};}
}
