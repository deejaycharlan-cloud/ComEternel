import {currentWorkspace} from '../modules/identity/workspace';
import type {Metadata,Viewport} from 'next';
import {Workspace,type WorkspaceViewer} from '../components/workspace';
import {currentSession} from '../modules/identity/session';
import './globals.css';
export const viewport:Viewport={width:'device-width',initialScale:1};
export const metadata:Metadata={title:{default:'ComÉternel · Accueil',template:'%s · ComÉternel'},description:'La communication au service du Christ.'};
export default async function Layout({children}:Readonly<{children:React.ReactNode}>){
 const actor=await currentSession();let viewer:WorkspaceViewer=null;
 if(actor?.user.emailVerified){const spaces=await currentWorkspace();viewer={name:actor.user.name||'Mon compte',spaces:spaces.map(s=>({id:s.id,name:s.name,deletionDate:s.deletionDate?.toISOString(),admin:s.role==='admin',pendingRequests:s.pendingRequests,canRead:s.canRead,canCreate:s.canCreate}))};}
 return <html lang="fr"><body><Workspace viewer={viewer} localPilot={process.env.AUTH_MAIL_MODE==='local'}>{children}</Workspace></body></html>;
}
