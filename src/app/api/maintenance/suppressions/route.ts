import {getDb} from '../../../../db/client';
import {processDeletions} from '../../../../modules/identity/deletion';
import {sql} from 'drizzle-orm';
export const dynamic='force-dynamic';
export const maxDuration=60;
// Public bounded expiry sweep: no target/date parameters, only previously authorized expired requests.
export async function GET(){const db=getDb();try{
 const result=await db.execute(sql`insert into request_limits(key,count,expires_at) values('deletion-sweep',1,now()+interval '1 minute') on conflict(key) do update set count=1,expires_at=now()+interval '1 minute' where request_limits.expires_at < now() returning key`);
 if(result.rowCount)await processDeletions(db);
 return new Response(null,{status:204});
}catch{console.error('Traitement des suppressions à reprendre.');return new Response(null,{status:503});}}
