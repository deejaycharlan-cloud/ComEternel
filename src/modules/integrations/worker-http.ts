import {getDb} from '../../db/client';
import {boundedBody} from '../production/limits';
import {AccessError} from '../team/service';
import {ProductionError} from '../production/access';
import {driveConfig,authenticateWorker,driveTransferService} from './drive-transfers';
export async function workerRequest(request:Request,operation:'claim'|'reserve'|'file'|'result',id=''){
 try{const config=authenticateWorker(request.headers.get('authorization'),driveConfig());const service=driveTransferService(getDb(),config);if(operation==='file'){const f=await service.file(id,request.headers.get('X-Cometernel-Lease')||'');return new Response(new Uint8Array(f.bytes),{headers:{'Content-Type':'application/octet-stream','Content-Disposition':`attachment; filename*=UTF-8''${encodeURIComponent(f.name)}`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}const body=JSON.parse((await boundedBody(request,10000)).toString());const result=operation==='claim'?await service.claim(body.requestId):operation==='reserve'?await service.reserve(id,body):await service.result(id,body);return Response.json(result,{headers:{'Cache-Control':'no-store'}});}catch(error){return Response.json({error:error instanceof AccessError?'unauthorized':error instanceof ProductionError?'transfer_unavailable':'invalid_request'},{status:error instanceof AccessError?403:409,headers:{'Cache-Control':'no-store'}});}
}
