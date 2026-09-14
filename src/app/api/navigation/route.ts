import {currentSession} from '../../../modules/identity/session';
import {workspaceSummary} from '../../../modules/team/workspace-summary';
import {getDb} from '../../../db/client';
export const dynamic='force-dynamic';
export async function GET(){
 const actor=await currentSession();const headers={'cache-control':'private, no-store'};
 if(!actor?.user.emailVerified)return Response.json({error:'Connexion requise'},{status:401,headers});
 const spaces=await workspaceSummary(getDb(),actor);
 return Response.json({name:actor.user.name||'Mon compte',spaces:spaces.map(s=>({id:s.id,name:s.name,deletionDate:s.deletionDate?.toISOString(),admin:s.role==='admin',pendingRequests:s.pendingRequests,canRead:s.canRead,canCreate:s.canCreate}))},{headers});
}
