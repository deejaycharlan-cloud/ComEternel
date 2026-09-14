export const maxDuration=60;
import {after} from 'next/server';
import {getDb} from '../../../../db/client';
import {who,failure} from '../../../../modules/production/http';
import {directDriveService} from '../../../../modules/integrations/direct-drive/service';
import {signalClassification} from '../../../../modules/integrations/direct-drive/signal';
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){try{const actor=await who(request);const r=await directDriveService(getDb()).complete(actor,(await params).id);after(signalClassification);return Response.json(r,{headers:{'Cache-Control':'no-store'}});}catch(e){return failure(e);}}
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){try{return Response.json(await directDriveService(getDb()).status(await who(request),(await params).id),{headers:{'Cache-Control':'no-store'}});}catch(e){return failure(e);}}
