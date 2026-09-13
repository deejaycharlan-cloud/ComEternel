import {requestLimit} from './limits';
import {NextResponse} from 'next/server';
import {currentSession} from '../identity/session';
import {AccessError} from '../team/service';
import {ProductionError} from './access';
import type {UploadActor} from './media-service';
export async function who(request:Request):Promise<UploadActor>{await requestLimit(request,'uploads',180);const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)throw new AccessError();const token=request.headers.get('x-collection-token');if(token)return {token,code:request.headers.get('x-collection-code')||''};const actor=await currentSession();if(!actor)throw new AccessError();return {actor,org:request.headers.get('x-organization')||''};}
export function failure(e:unknown){return NextResponse.json({error:e instanceof ProductionError||e instanceof AccessError?e.message:'Envoi impossible. Vérifiez les données puis reprenez.'},{status:e instanceof AccessError?403:400});}
