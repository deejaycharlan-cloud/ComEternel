import {currentSession} from '../../../../modules/identity/session';
import {getDb} from '../../../../db/client';
import {contentService} from '../../../../modules/production/content-service';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){try{const actor=await currentSession();if(!actor)return new Response('Connexion requise',{status:401});const data=await contentService(getDb()).export(actor,new URL(request.url).searchParams.get('organisation')||'',(await params).id);return new Response(JSON.stringify(data,null,2),{headers:{'Content-Type':'application/json','Content-Disposition':'attachment; filename="paquet-publication.json"','Cache-Control':'private, no-store'}});}catch{return new Response('Version non prête ou accès refusé',{status:403});}}
