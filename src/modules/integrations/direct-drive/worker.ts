import {timingSafeEqual,createHash} from 'node:crypto';
import {getDb} from '../../../db/client';
import {AccessError} from '../../team/service';
import {boundedBody} from '../../production/limits';
import {directDriveService} from './service';
export function authenticateClassification(header:string|null){const token=process.env.N8N_SERVICE_TOKEN;if(!token||token.length<32)throw new AccessError();const digest=(v:string)=>createHash('sha256').update(v).digest();if(!timingSafeEqual(digest(header||''),digest(`Bearer ${token}`)))throw new AccessError();}
export async function worker(request:Request,operation:'claim'|'classify'){try{authenticateClassification(request.headers.get('authorization'));const data=JSON.parse((await boundedBody(request,4096)).toString());const s=directDriveService(getDb());return Response.json(operation==='claim'?await s.claim():await s.classify(data.id,data.leaseId),{headers:{'Cache-Control':'no-store'}});}catch(e){return Response.json({error:e instanceof AccessError?'unauthorized':'classification_unavailable'},{status:e instanceof AccessError?403:409});}}
