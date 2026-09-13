import {sql,lt} from 'drizzle-orm';
import {getDb} from '../../db/client';
import {requestLimits} from '../../db/production-schema';
import {hash} from './storage';
import {ProductionError} from './access';
export async function requestLimit(request:Request,bucket:string,max:number){await getDb().delete(requestLimits).where(lt(requestLimits.expiresAt,new Date()));const window=Math.floor(Date.now()/60000);const ip=request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'local';const key=hash(`${bucket}:${ip}:${window}`);const [row]=await getDb().insert(requestLimits).values({key,count:1,expiresAt:new Date((window+2)*60000)}).onConflictDoUpdate({target:requestLimits.key,set:{count:sql`${requestLimits.count}+1`}}).returning();if(row.count>max)throw new ProductionError('Trop de tentatives. Patientez une minute avant de réessayer.');}
export async function boundedBody(request:Request,max:number){const reader=request.body?.getReader();if(!reader)return Buffer.alloc(0);let length=0;const chunks:Uint8Array[]=[];for(;;){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>max){await reader.cancel();throw new ProductionError('Envoi trop volumineux.');}chunks.push(value);}return Buffer.concat(chunks);}
