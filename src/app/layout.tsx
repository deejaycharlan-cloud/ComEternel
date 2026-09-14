import {eq} from 'drizzle-orm';
import {organizationDeletions} from '../db/team-schema';
import type {Metadata} from 'next';
import {Workspace,type WorkspaceViewer} from '../components/workspace';
import {currentSession} from '../modules/identity/session';
import {teamService} from '../modules/team/service';
import {programmeService} from '../modules/programme/service';
import {getDb} from '../db/client';
import './globals.css';
export const metadata:Metadata={title:{default:'ComÉternel · Accueil',template:'%s · ComÉternel'},description:'La communication au service du Christ.'};
export default async function Layout({children}:Readonly<{children:React.ReactNode}>){
 const actor=await currentSession();let viewer:WorkspaceViewer=null;
 if(actor?.user.emailVerified){const db=getDb(),team=teamService(db),programme=programmeService(db);const spaces=await team.listOrganizations(actor);viewer={name:actor.user.name||'Mon compte',spaces:await Promise.all(spaces.map(async s=>({id:s.id,name:s.name,deletionDate:(await db.select().from(organizationDeletions).where(eq(organizationDeletions.organizationId,s.id)))[0]?.dueAt.toISOString(),admin:s.role==='admin',pendingRequests:s.role==='admin'?(await team.listJoinRequests(actor,s.id)).length:0,canRead:(await programme.list(actor,s.id)).length>0,canCreate:await programme.canCreate(actor,s.id)})))};}
 return <html lang="fr"><body><Workspace viewer={viewer} localPilot={process.env.AUTH_MAIL_MODE==='local'}>{children}</Workspace></body></html>;
}
