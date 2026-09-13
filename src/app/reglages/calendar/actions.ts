'use server';
import {after} from 'next/server';
import {revalidatePath} from 'next/cache';
import {eq} from 'drizzle-orm';
import {getDb} from '../../../db/client';
import {googleCalendars} from '../../../db/team-schema';
import {currentSession} from '../../../modules/identity/session';
import {calendarAdmin,syncCalendar} from '../../../modules/integrations/calendar/service';
export async function calendarAction(_state:{message:string},form:FormData){try{const actor=await currentSession();if(!actor)throw new Error();const org=String(form.get('organizationId'));await calendarAdmin(actor,org);
 if(form.get('operation')==='disconnect'){await getDb().delete(googleCalendars).where(eq(googleCalendars.organizationId,org));revalidatePath('/reglages');return {message:'Synchronisation arrêtée. Le calendrier existant reste dans Google.'};}
 await getDb().update(googleCalendars).set({status:'pending'}).where(eq(googleCalendars.organizationId,org));after(()=>syncCalendar(org));revalidatePath('/reglages');return {message:'Synchronisation demandée. Actualisez cette page dans quelques instants.'};
 }catch{return {message:'Opération impossible. Reconnectez-vous avec un compte administrateur puis réessayez.'};}}
