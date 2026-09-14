import {and,eq,isNull} from 'drizzle-orm';
import {driveConnections} from '../../../db/production-schema';
import {members} from '../../../db/team-schema';
import {seal,unseal} from '../calendar/security';
import {type DB,ProductionError} from '../../production/access';
export const driveScope='https://www.googleapis.com/auth/drive.file';
export const callbackUrl=()=>`${process.env.BETTER_AUTH_URL}/api/google-drive/callback`;
export type Connection=typeof driveConnections.$inferSelect;
export async function connectionToken(db:DB,c:Connection){
 if(c.status!=='connected')throw new ProductionError('Reconnectez le Drive de cette association.');
 const [admin]=await db.select().from(members).where(and(eq(members.organizationId,c.organizationId),eq(members.userId,c.connectedBy),eq(members.role,'admin'),isNull(members.revokedAt)));if(!admin)throw new ProductionError('Un administrateur doit reconnecter le Drive de cette association.');
 const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:process.env.GOOGLE_CLIENT_ID!,client_secret:process.env.GOOGLE_CLIENT_SECRET!,grant_type:'refresh_token',refresh_token:unseal(c.refreshToken,`drive:${c.organizationId}`)}),signal:AbortSignal.timeout(15000)});
 const tokens=await response.json();if(!response.ok||!tokens.access_token)throw new ProductionError('Google Drive demande une reconnexion de l’association.');return tokens.access_token as string;
}
export class DriveError extends ProductionError { constructor(public readonly status:number){super(`Opération Drive impossible (${status}). Réessayez ou reconnectez le compte de l’association.`);} }
export async function google(token:string,path:string,method='GET',body?:unknown){
 const r=await fetch(`https://www.googleapis.com/drive/v3/${path}`,{method,headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000)});if(!r.ok)throw new DriveError(r.status);return r.json();
}
export const metaFields='id,name,size,mimeType,sha256Checksum,parents,trashed,appProperties';
export function assertSessionUri(uri:string){const u=new URL(uri);if(u.protocol!=='https:'||u.hostname!=='www.googleapis.com'||!u.pathname.startsWith('/upload/drive/v3/files'))throw new ProductionError('Session Drive invalide.');return uri;}
export async function folder(token:string,parent:string|null,key:string,name:string,org:string){
 // Stable keys prevent duplicate folders when names are changed or a retry occurs.
 const q=`trashed = false and mimeType = 'application/vnd.google-apps.folder' and appProperties has { key='cometernelFolder' and value='${key}' }${parent?` and '${parent}' in parents`:''}`;
 const found=await google(token,`files?${new URLSearchParams({q,fields:'files(id)',spaces:'drive'})}`);if(found.files?.length)return found.files[0].id as string;
 const made=await google(token,'files?fields=id','POST',{name,mimeType:'application/vnd.google-apps.folder',...(parent?{parents:[parent]}:{}),appProperties:{cometernelFolder:key,cometernelOrg:org}});return made.id as string;
}
export {seal,unseal};
