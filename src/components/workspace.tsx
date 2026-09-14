'use client';
import {createContext,useContext,useEffect,useRef} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {usePathname,useSearchParams,useRouter} from 'next/navigation';
import {NavigationIcon,type NavigationIconName} from './navigation-icon';
import type {Profile} from '../modules/preview/data';
const PreviewContext=createContext({demo:false,profile:'coordinateur' as Profile});
export const usePreview=()=>useContext(PreviewContext);
export type WorkspaceViewer={name:string;spaces:{id:string;name:string;admin:boolean;pendingRequests?:number;deletionDate?:string;canRead:boolean;canCreate:boolean}[]}|null;
export function Workspace({children,viewer,localPilot}:{children:React.ReactNode;viewer:WorkspaceViewer;localPilot:boolean}){
 const path=usePathname(),query=useSearchParams();
 const requested=query.get('organisation');
 const space=viewer?.spaces.find(s=>s.id===requested)||(requested?undefined:viewer?.spaces[0]);
 const router=useRouter();
 const accountMenu=useRef<HTMLDetailsElement>(null);
 useEffect(()=>{if(accountMenu.current)accountMenu.current.open=false;},[path,requested]);
 useEffect(()=>{
  const closeOutside=(event:Event)=>{const menu=accountMenu.current;if(menu?.open&&event.target instanceof Node&&!menu.contains(event.target))menu.open=false;};
  const closeEscape=(event:KeyboardEvent)=>{const menu=accountMenu.current;if(event.key==='Escape'&&menu?.open){menu.open=false;menu.querySelector('summary')?.focus();}};
  document.addEventListener('pointerdown',closeOutside);
  document.addEventListener('focusin',closeOutside);
  document.addEventListener('keydown',closeEscape);
  return()=>{document.removeEventListener('pointerdown',closeOutside);document.removeEventListener('focusin',closeOutside);document.removeEventListener('keydown',closeEscape);};
 },[]);
 useEffect(()=>{if(!space?.admin)return;const refresh=()=>{if(document.visibilityState==='visible')router.refresh();};const timer=setInterval(refresh,60000);window.addEventListener('focus',refresh);return()=>{clearInterval(timer);window.removeEventListener('focus',refresh);};},[space?.admin,space?.id,router]);
 const inside=Boolean(space)&&path!=='/connexion';
 const inSpace=(href:string)=>space?`${href}?organisation=${space.id}`:href;
 const navigation:[string,string,NavigationIconName][]=[['/','Accueil','home']];
 if(space){navigation.push(['/taches','Mes tâches','tasks']);if(space.canRead||space.canCreate)navigation.push(['/projets','Projets','folder']);navigation.push(['/calendrier','Événements','calendar'],['/contenus','Calendrier éditorial','content']);if(space.canRead)navigation.push(['/medias','Médias','media']);}
 if(/^\/collectes\/[^/]+$/.test(path))return <main id="main" className="guest-page">{space?.admin&&Boolean(space.pendingRequests)&&<p className="notice" role="status"><Link href={inSpace('/equipe')+'#demandes'}>{space.pendingRequests} demande{space.pendingRequests!>1?'s':''} d’accès en attente — Examiner les demandes</Link></p>}{children}</main>;
 return <PreviewContext.Provider value={{demo:false,profile:'coordinateur'}}><a className="skip" href="#main">Aller au contenu</a><header className="app-header"><Link href={inside?inSpace('/'):'/'} className="brand" aria-label="ComÉternel — Accueil"><Image className="brand-logo" src="/logo-com-eternel.png" alt="" width={88} height={88} priority/></Link>{inside?<>{path==='/'&&<div className="workspace-identity"><span>VOTRE ÉQUIPE</span><strong>{space!.name}</strong></div>}<details ref={accountMenu} className="account-menu"><summary><span className="avatar" aria-hidden="true">{viewer!.name.slice(0,1).toLocaleUpperCase('fr')}</span><span>{viewer!.name}<small>Mon compte</small></span><span aria-hidden="true">⌄</span></summary><div className="account-dropdown" onClick={event=>{if(event.target instanceof Element&&event.target.closest('a')&&accountMenu.current)accountMenu.current.open=false;}}><Link href="/compte">Mon compte</Link>{space!.admin&&<Link href={inSpace('/equipe')+'#inviter'}>Inviter un membre</Link>}<Link href="/invitations">Rejoindre une équipe avec un code</Link>{viewer!.spaces.length>1&&<><p>Changer d’équipe</p>{viewer!.spaces.map(s=><Link key={s.id} href={`/?organisation=${s.id}`} aria-current={space!.id===s.id?'true':undefined}>{s.name}</Link>)}</>}</div></details></>:<div className="public-header-links"><span>Unis pour mieux communiquer</span><Link className="button" href={viewer?'/compte':'/connexion'}>{viewer?'Mon compte':'Se connecter'}</Link></div>}</header><div className={inside?'workspace':'workspace public-workspace'}>{inside&&<nav className="primary-nav" aria-label="Navigation principale"><p className="nav-caption">AU QUOTIDIEN</p>{navigation.map(([href,label,icon])=><Link key={href} href={inSpace(href)} aria-current={(href==='/'?path===href:path.startsWith(href))?'page':undefined}><NavigationIcon name={icon}/>{label}</Link>)}{space!.admin&&<div className="nav-admin"><p className="nav-caption">ADMINISTRATION</p><Link href={inSpace('/equipe')} aria-current={path==='/equipe'?'page':undefined}><NavigationIcon name="team"/>Membres et invitations{Boolean(space!.pendingRequests)&&<strong aria-label={`${space!.pendingRequests} demandes en attente`}> ({space!.pendingRequests})</strong>}</Link><Link href={inSpace('/reglages')} aria-current={path==='/reglages'||path==='/exploitation'?'page':undefined}><NavigationIcon name="settings"/>Réglages de l’équipe</Link></div>}<div className="nav-note"><span aria-hidden="true">✦</span> Chaque talent compte.</div></nav>}<main id="main" tabIndex={-1}>{space?.deletionDate&&<p className="notice" role="status">Suppression de cette association prévue à partir du {new Date(space.deletionDate).toLocaleDateString('fr-FR',{timeZone:'UTC'})}. {space.admin?<Link href="/compte/suppression">Annuler ou transférer l’administration</Link>:'Contactez votre administrateur pour conserver cet espace.'}</p>}{space?.admin&&Boolean(space.pendingRequests)&&<p className="notice" role="status"><Link href={inSpace('/equipe')+'#demandes'}>{space.pendingRequests} demande{space.pendingRequests!>1?'s':''} d’accès en attente — Examiner les demandes</Link></p>}{children}</main></div><footer className={inside?'workspace-footer':undefined}><span>La communication au service du Christ.</span><Link href="/confidentialite">Confidentialité · Contact</Link>{localPilot&&<span className="pilot-label"><i aria-hidden="true"/> Environnement de test · Données locales</span>}{!viewer&&<Link href="/connexion">Accès à l’équipe</Link>}</footer></PreviewContext.Provider>;
}
