import {randomBytes,createHash} from 'node:crypto';
import {getDb} from '../../../../db/client';
import {verification} from '../../../../db/auth-schema';
import {currentSession} from '../../../../modules/identity/session';
import {calendarAdmin} from '../../../../modules/integrations/calendar/service';
import {driveScope,callbackUrl,seal} from '../../../../modules/integrations/direct-drive/google';
export async function POST(request:Request){try{
 if(request.headers.get('origin')!==new URL(process.env.BETTER_AUTH_URL!).origin)return new Response(null,{status:403});
 const actor=await currentSession();if(!actor)return new Response(null,{status:401});
 const data=await request.formData();const org=String(data.get('organizationId'));if(!/^[a-f0-9-]{36}$/.test(org))throw new Error();const age=Date.now()-new Date(actor.session.createdAt).getTime();if(!Number.isFinite(age)||age<0||age>300000)return Response.redirect(`${process.env.BETTER_AUTH_URL}/connexion?retour=${encodeURIComponent(`/reglages?organisation=${org}`)}`,303);await calendarAdmin(actor,org);
 if(!process.env.GOOGLE_CLIENT_ID||!process.env.GOOGLE_CLIENT_SECRET)throw new Error();
 const state=randomBytes(32).toString('base64url'),verifier=randomBytes(32).toString('base64url');
 const id=createHash('sha256').update(state).digest('hex');
 await getDb().insert(verification).values({id,identifier:'drive-oauth',value:seal(JSON.stringify({org,user:actor.user.id,session:new Date(actor.session.createdAt).toISOString(),verifier}),id),expiresAt:new Date(Date.now()+600000)});
 const query=new URLSearchParams({client_id:process.env.GOOGLE_CLIENT_ID,redirect_uri:callbackUrl(),response_type:'code',scope:`openid email ${driveScope}`,access_type:'offline',prompt:'consent select_account',state,code_challenge:createHash('sha256').update(verifier).digest('base64url'),code_challenge_method:'S256'});
 return Response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${query}`,303);
 }catch{return Response.redirect(`${process.env.BETTER_AUTH_URL}/reglages?drive=error`,303);}}
