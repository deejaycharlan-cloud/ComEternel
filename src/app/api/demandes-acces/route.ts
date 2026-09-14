import {after} from 'next/server';
import {notifyJoinRequest} from '../../../modules/team/notifications';
import { getDb } from '../../../db/client';
import { teamService } from '../../../modules/team/service';
import { requestLimit } from '../../../modules/production/limits';
export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) return new Response(null,{status:403});
  try {
    await requestLimit(request,'join-request',5);
    const text=await request.text(); if(text.length>1024)return new Response(null,{status:413});
    const data=JSON.parse(text);
    const id=await teamService(getDb()).requestJoin(data.email,data.code);
    if(id)after(async()=>{try{await notifyJoinRequest(getDb(),id);}catch{console.error('join_notification_failed');}});
    return Response.json({message:'Si le code correspond à une association, votre demande est transmise à son administrateur. Aucun accès n’est accordé avant validation.'});
  } catch { return Response.json({message:'Demande impossible. Vérifiez votre adresse et le code, ou réessayez dans quelques minutes.'},{status:400}); }
}
