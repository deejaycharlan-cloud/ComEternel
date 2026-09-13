import {createHash} from 'node:crypto';
import {and,eq,gt} from 'drizzle-orm';
import {after} from 'next/server';
import {getDb} from '../../../../db/client';
import {verification} from '../../../../db/auth-schema';
import {googleCalendars} from '../../../../db/team-schema';
import {organizations} from '../../../../db/schema';
import {currentSession} from '../../../../modules/identity/session';
import {calendarAdmin,googleRequest,syncCalendar} from '../../../../modules/integrations/calendar/service';
import {calendarScope,callbackUrl,seal,unseal} from '../../../../modules/integrations/calendar/security';
export async function GET(request:Request){const origin=process.env.BETTER_AUTH_URL!;try{
 const query=new URL(request.url).searchParams;const state=query.get('state')||'';if(!/^[\w-]{43}$/.test(state)||query.has('error'))throw new Error();
 const actor=await currentSession();if(!actor)throw new Error();const db=getDb();const id=createHash('sha256').update(state).digest('hex');
 const [record]=await db.select().from(verification).where(and(eq(verification.id,id),eq(verification.identifier,'calendar-oauth'),gt(verification.expiresAt,new Date())));if(!record)throw new Error();
 const saved=JSON.parse(unseal(record.value,id));if(saved.user!==actor.user.id||saved.session!==new Date(actor.session.createdAt).toISOString())throw new Error();
 await calendarAdmin(actor,saved.org);
 const consumed=await db.delete(verification).where(eq(verification.id,id)).returning();if(!consumed.length)throw new Error();
 const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:process.env.GOOGLE_CLIENT_ID!,client_secret:process.env.GOOGLE_CLIENT_SECRET!,code:query.get('code')||'',grant_type:'authorization_code',redirect_uri:callbackUrl(),code_verifier:saved.verifier}),signal:AbortSignal.timeout(15000)});
 const tokens=await response.json();if(!response.ok||!tokens.refresh_token||!tokens.scope?.split(' ').includes(calendarScope))throw new Error();
 const info=await fetch('https://openidconnect.googleapis.com/v1/userinfo',{headers:{authorization:`Bearer ${tokens.access_token}`},signal:AbortSignal.timeout(15000)});const google=await info.json();if(!info.ok||!google.email_verified||!google.sub||!google.email)throw new Error();
 await db.transaction(async tx=>{
 const [org]=await tx.select().from(organizations).where(eq(organizations.id,saved.org)).for('update');if(!org)throw new Error();
 const [previous]=await tx.select().from(googleCalendars).where(eq(googleCalendars.organizationId,org.id));
 if(previous&&previous.googleSubject!==google.sub)throw new Error('disconnect_first');
 let calendarId=previous?.calendarId;
 if(!calendarId){const created=await googleRequest('calendars',tokens.access_token,'POST',{summary:`ComÉternel — ${org.name}`,timeZone:org.timezone,description:'Événements gérés depuis ComÉternel. Modifiez les informations dans ComÉternel.'});const calendar=await created.json();if(!created.ok||!calendar.id)throw new Error();calendarId=calendar.id;}
 const values={organizationId:org.id,connectedBy:actor.user.id,googleEmail:google.email,googleSubject:google.sub,refreshToken:seal(tokens.refresh_token,org.id),calendarId:calendarId!,status:'pending'};
 await tx.insert(googleCalendars).values(values).onConflictDoUpdate({target:googleCalendars.organizationId,set:values});
 });
 after(()=>syncCalendar(saved.org));return Response.redirect(`${origin}/reglages?organisation=${saved.org}&calendar=connected`,303);
 }catch{return Response.redirect(`${origin}/reglages?calendar=error`,303);}}
