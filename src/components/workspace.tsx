'use client';
import {createContext,useContext,useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {usePathname,useSearchParams} from 'next/navigation';
import {NavigationIcon,type NavigationIconName} from './navigation-icon';
import {NavigationRail} from './navigation-rail';
import {NavigationTrail} from './navigation-trail';
import {navigationSection} from '../modules/identity/navigation-route';
import {SignOut} from '../app/compte/account-controls';
import {PageSearch} from './page-search';
import type {Profile} from '../modules/preview/data';
const PreviewContext=createContext({demo:false,profile:'coordinateur' as Profile});
export const usePreview=()=>useContext(PreviewContext);
export type WorkspaceViewer={name:string;spaces:{id:string;name:string;admin:boolean;pendingRequests?:number;deletionDate?:string;canRead:boolean;canCreate:boolean}[]}|null;
export function Workspace({children,viewer:initialViewer,localPilot}:{children:React.ReactNode;viewer:WorkspaceViewer;localPilot:boolean}){
 const [viewer,setViewer]=useState(initialViewer);
 useEffect(()=>setViewer(initialViewer),[initialViewer]);
 const path=usePathname(),query=useSearchParams();
 const requested=query.get('organisation');
 const space=viewer?.spaces.find(s=>s.id===requested)||(requested?undefined:viewer?.spaces[0]);
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
 useEffect(()=>{
  if(!initialViewer)return;let lastChecked=Date.now(),pending=false;const controller=new AbortController();
  const refresh=async()=>{if(document.visibilityState!=='visible'||pending||Date.now()-lastChecked<60000)return;pending=true;lastChecked=Date.now();try{const response=await fetch('/api/navigation',{cache:'no-store',signal:controller.signal});if(response.ok){const next=await response.json();if(!controller.signal.aborted)setViewer(next);}else if(response.status===401){window.location.assign('/connexion');}}catch{}finally{pending=false;}};
  const timer=setInterval(()=>void refresh(),60000);window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',refresh);
  return()=>{controller.abort();clearInterval(timer);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh);};
 },[initialViewer]);
 const inside=Boolean(space)&&path!=='/connexion';
 const inSpace=(href:string)=>space?`${href}?organisation=${space.id}`:href;
 const navigation:[string,string,NavigationIconName][]=[['/','Accueil','home']];
 if(space){navigation.push(['/taches','Mes tâches','tasks']);if(space.canRead||space.canCreate)navigation.push(['/projets','Projets','folder']);navigation.push(['/calendrier','Événements','calendar'],['/contenus','Calendrier éditorial','calendar'],['/livrables','Contenus et livrables','content']);navigation.push(['/medias','Rushs des événements','media']);}
 const searchPages=[...navigation.map(([href,label])=>({href:inSpace(href),label,keywords:({'/livrables':'creation montage visuel validation versions publication','/medias':'importer fichiers photos videos rushs drive' ,'/contenus':'diffusion publication livrables','/calendrier':'agenda dates','/projets':'evenement creation'} as Record<string,string>)[href]||''})),{href:inSpace('/medias/importer'),label:'Importer les rushs d’un événement',keywords:'depot upload fichiers'}, {href:'/compte',label:'Mon compte',keywords:'profil suppression'}, {href:inSpace('/aide'),label:'Aide et guide de démarrage',keywords:'tutoriel documentation index comment utiliser'}, {href:inSpace('/aide')+'#fichiers',label:'Aide : importer et classer les fichiers',keywords:'photo video drive stockage'}, ...(space?.admin?[{href:inSpace('/equipe'),label:'Membres et invitations',keywords:'equipe roles acces code email'}, {href:inSpace('/reglages'),label:'Réglages de l’équipe',keywords:'association google synchronisation calendar'}]:[])];
 if(/^\/collectes\/[^/]+$/.test(path))return <main id="main" className="guest-page">{space?.admin&&Boolean(space.pendingRequests)&&<p className="notice" role="status"><Link href={inSpace('/equipe')+'#demandes'}>{space.pendingRequests} demande{space.pendingRequests!>1?'s':''} d’accès en attente — Examiner les demandes</Link></p>}{children}</main>;
 return <PreviewContext.Provider value={{demo:false,profile:'coordinateur'}}><a className="skip" href="#main">Aller au contenu</a><header className="app-header"><Link href={inside?inSpace('/'):'/'} className="brand" aria-label="ComÉternel — Accueil"><Image className="brand-logo" src="/logo-com-eternel.png" alt="" width={88} height={88} priority/></Link>{inside?<>{path==='/'&&<div className="workspace-identity"><span>VOTRE ÉQUIPE</span><strong>{space!.name}</strong></div>}<PageSearch pages={searchPages}/><details ref={accountMenu} className="account-menu"><summary><span className="avatar" aria-hidden="true">{viewer!.name.slice(0,1).toLocaleUpperCase('fr')}</span><span>{viewer!.name}<small>Mon compte</small></span><span aria-hidden="true">⌄</span></summary><div className="account-dropdown" onClick={event=>{if(event.target instanceof Element&&event.target.closest('a')&&accountMenu.current)accountMenu.current.open=false;}}><Link href="/compte">Mon compte</Link>{space!.admin&&<Link href={inSpace('/equipe')+'#inviter'}>Inviter un membre</Link>}<Link href="/invitations">Rejoindre une équipe avec un code</Link>{viewer!.spaces.length>1&&<><p>Changer d’équipe</p>{viewer!.spaces.map(s=><Link key={s.id} href={`/?organisation=${s.id}`} aria-current={space!.id===s.id?'true':undefined}>{s.name}</Link>)}</>}<SignOut/></div></details></>:<div className="public-header-links"><span>Unis pour mieux communiquer</span><Link className="button" href={viewer?'/compte':'/connexion'}>{viewer?'Mon compte':'Se connecter'}</Link></div>}</header><div className={inside?'workspace':'workspace public-workspace'}>{inside&&<NavigationRail routeKey={path+':'+(requested||'')}><p className="nav-caption">AU QUOTIDIEN</p>{navigation.map(([href,label,icon])=><Link key={href} href={inSpace(href)} aria-current={navigationSection(path)===href?'page':undefined}><NavigationIcon name={icon}/>{label}</Link>)}{space!.admin&&<div className="nav-admin"><p className="nav-caption">ADMINISTRATION</p><Link href={inSpace('/equipe')} aria-current={path==='/equipe'?'page':undefined}><NavigationIcon name="team"/>Membres et invitations{Boolean(space!.pendingRequests)&&<strong aria-label={`${space!.pendingRequests} demandes en attente`}> ({space!.pendingRequests})</strong>}</Link><Link href={inSpace('/reglages')} aria-current={path==='/reglages'||path==='/exploitation'?'page':undefined}><NavigationIcon name="settings"/>Réglages de l’équipe</Link></div>}<Link href={inSpace('/aide')} aria-current={path==='/aide'?'page':undefined}><span aria-hidden="true">?</span>Aide et tutoriel</Link><div className="nav-note"><span aria-hidden="true">✦</span> Chaque talent compte.</div></NavigationRail>}<main id="main" tabIndex={-1}>{inside&&<NavigationTrail path={path} organizationId={space!.id} canCreate={space!.canCreate}/>}{space?.deletionDate&&<p className="notice" role="status">Suppression de cette association prévue à partir du {new Date(space.deletionDate).toLocaleDateString('fr-FR',{timeZone:'UTC'})}. {space.admin?<Link href="/compte/suppression">Annuler ou transférer l’administration</Link>:'Contactez votre administrateur pour conserver cet espace.'}</p>}{space?.admin&&Boolean(space.pendingRequests)&&<p className="notice" role="status"><Link href={inSpace('/equipe')+'#demandes'}>{space.pendingRequests} demande{space.pendingRequests!>1?'s':''} d’accès en attente — Examiner les demandes</Link></p>}{children}</main></div><footer className={inside?'workspace-footer':undefined}><span>La communication au service du Christ.</span><Link href="/confidentialite">Confidentialité · Contact</Link>{localPilot&&<span className="pilot-label"><i aria-hidden="true"/> Environnement de test · Données locales</span>}{!viewer&&<Link href="/connexion">Accès à l’équipe</Link>}</footer></PreviewContext.Provider>;
}
