import {and,eq,isNull,sql} from 'drizzle-orm';
import {getDb} from '../../../db/client';
import {googleCalendars,members} from '../../../db/team-schema';
import {organizations} from '../../../db/schema';
import {occurrences,projects} from '../../../db/programme-schema';
import {type Actor,teamService,requireFresh,AccessError} from '../../team/service';
import {unseal} from './security';
import {googleEvent} from './events';
export async function calendarAdmin(actor:Actor,org:string){requireFresh(actor);const member=await teamService(getDb()).membership(actor,org);if(member.role!=='admin')throw new AccessError();}
export async function googleRequest(path:string,token:string,method='GET',body?:unknown){return fetch(`https://www.googleapis.com/calendar/v3/${path}`,{method,headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(15000)});}
// Verrou par association : deux sauvegardes concurrentes ne réécrivent pas des dates obsolètes.
export async function syncCalendar(org:string,db=getDb()){try{await db.transaction(async tx=>{
 await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`calendar:${org}`},0))`);
 const [connection]=await tx.select().from(googleCalendars).where(eq(googleCalendars.organizationId,org)).for('update');if(!connection)return;
 const [admin]=await tx.select().from(members).where(and(eq(members.organizationId,org),eq(members.userId,connection.connectedBy),eq(members.role,'admin'),isNull(members.revokedAt)));
 if(!admin){await tx.update(googleCalendars).set({status:'reconnect'}).where(eq(googleCalendars.organizationId,org));return;}
 const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:process.env.GOOGLE_CLIENT_ID!,client_secret:process.env.GOOGLE_CLIENT_SECRET!,grant_type:'refresh_token',refresh_token:unseal(connection.refreshToken,org)}),signal:AbortSignal.timeout(15000)});
 const tokens=await response.json();if(!response.ok||!tokens.access_token)throw new Error('google_refresh_failed');
 const rows=await tx.select({project:projects,event:occurrences}).from(occurrences).innerJoin(projects,eq(projects.id,occurrences.projectId)).where(eq(projects.organizationId,org));
 for(let i=0;i<rows.length;i+=5){await Promise.all(rows.slice(i,i+5).map(async row=>{
 const body=googleEvent(row.project,row.event);const path=`calendars/${encodeURIComponent(connection.calendarId)}/events/${body.id}`;
 // Annulation conservée dans ComÉternel ; suppression de la copie Google seulement.
 if(body.status==='cancelled'){const deleted=await googleRequest(path,tokens.access_token,'DELETE');if(!deleted.ok&&![404,410].includes(deleted.status))throw new Error('google_event_failed');return;}
 // L'archivage conserve la dernière copie Google comme historique.
 if(row.project.status==='archived')return;
 let updated=await googleRequest(path,tokens.access_token,'PUT',body);
 if(updated.status===404){updated=await googleRequest(`calendars/${encodeURIComponent(connection.calendarId)}/events`,tokens.access_token,'POST',body);if(updated.status===409)updated=await googleRequest(path,tokens.access_token,'PUT',body);}
 if(!updated.ok)throw new Error('google_event_failed');
 }));}
 await tx.update(googleCalendars).set({status:'synced',lastSyncedAt:new Date()}).where(eq(googleCalendars.organizationId,org));
 });}catch{await db.update(googleCalendars).set({status:'error'}).where(eq(googleCalendars.organizationId,org));}}
