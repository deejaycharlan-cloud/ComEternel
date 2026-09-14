import {and,eq,inArray,ne} from 'drizzle-orm';
import {media,directUploads} from '../../db/production-schema';
import type {Conn} from './access';
export async function contentAssets(c:Conn,assets:typeof media.$inferSelect[]) {
 const pending=assets.filter(m=>m.state==='received'&&m.received===m.size);
 const verified=pending.length?await c.select({mediaId:directUploads.mediaId,organizationId:directUploads.organizationId}).from(directUploads).where(and(inArray(directUploads.mediaId,pending.map(m=>m.id)),ne(directUploads.status,'uploading'))):[];
 return assets.map(m=>({...m,contentReady:m.category!=='rush'&&!['pending','refused'].includes(m.proposalState||'')&&(m.state==='controlled'||(m.state==='received'&&m.received===m.size&&verified.some(v=>v.mediaId===m.id&&v.organizationId===m.organizationId)))}));
}
