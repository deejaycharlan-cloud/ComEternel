import {createCipheriv,createDecipheriv,createHash,randomBytes} from 'node:crypto';
export const calendarScope='https://www.googleapis.com/auth/calendar.app.created';
export function seal(value:string,context:string){const iv=randomBytes(12),key=keyBytes();const cipher=createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(Buffer.from(context));const body=Buffer.concat([cipher.update(value,'utf8'),cipher.final()]);return [iv,body,cipher.getAuthTag()].map(x=>x.toString('base64url')).join('.');}
export function unseal(value:string,context:string){const [iv,body,tag]=value.split('.').map(x=>Buffer.from(x,'base64url'));const cipher=createDecipheriv('aes-256-gcm',keyBytes(),iv);cipher.setAAD(Buffer.from(context));cipher.setAuthTag(tag);return Buffer.concat([cipher.update(body),cipher.final()]).toString('utf8');}
function keyBytes(){const key=process.env.BETTER_AUTH_SECRET;if(!key||key.length<32)throw new Error('Configuration requise.');return createHash('sha256').update('cometernel-calendar-v1:'+key).digest();}
export function callbackUrl(){return `${process.env.BETTER_AUTH_URL}/api/google-calendar/callback`;}
