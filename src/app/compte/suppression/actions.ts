'use server';
import {currentSession} from '../../../modules/identity/session';
import {deletionService} from '../../../modules/identity/deletion';
import {getDb} from '../../../db/client';
import {AccessError} from '../../../modules/team/service';
import {revalidatePath} from 'next/cache';
export async function deletionAction(_: {message:string},form:FormData){try{const a=await currentSession();if(!a)throw new AccessError('Reconnectez-vous.');const s=deletionService(getDb()),op=String(form.get('operation'));if(op==='schedule')await s.schedule(a,String(form.get('confirm')));else if(op==='cancel')await s.cancel(a);else if(op==='transfer')await s.transfer(a,String(form.get('organizationId')),String(form.get('target')));else throw new AccessError();revalidatePath('/compte');revalidatePath('/equipe');revalidatePath('/compte/suppression');return {message:op==='schedule'?'Demande enregistrée. La suppression est prévue dans 30 jours.':op==='transfer'?'Administration transférée. La suppression de cette association est annulée.':'Demande de suppression annulée.'};}catch(e){return {message:e instanceof AccessError?e.message:'Opération impossible. Aucune confirmation de suppression. Réessayez.'};}}
