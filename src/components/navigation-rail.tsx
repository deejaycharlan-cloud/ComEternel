'use client';
import {useEffect,useRef,useState} from 'react';
export function NavigationRail({children,routeKey}:{children:React.ReactNode;routeKey:string}) {
 const ref=useRef<HTMLElement>(null),touch=useRef<{x:number;y:number}|null>(null);
 const [overflow,setOverflow]=useState(false),[dismissed,setDismissed]=useState(false);
 useEffect(()=>{try{setDismissed(sessionStorage.getItem('cometernel-tabs-swiped')==='yes');}catch{}},[]);
 useEffect(()=>{const nav=ref.current;if(!nav)return;const update=()=>setOverflow(nav.scrollWidth>nav.clientWidth+2);const observer=new ResizeObserver(update);observer.observe(nav);for(const child of nav.children)observer.observe(child);update();return()=>observer.disconnect();},[]);
 useEffect(()=>{const nav=ref.current;if(!nav||!window.matchMedia('(max-width:700px)').matches)return;const active=nav.querySelector<HTMLElement>('[aria-current="page"]');if(!active)return;const n=nav.getBoundingClientRect(),a=active.getBoundingClientRect();if(a.left<n.left)nav.scrollLeft-=n.left-a.left+12;else if(a.right>n.right)nav.scrollLeft+=a.right-n.right+12;},[routeKey]);
 const dismiss=()=>{setDismissed(true);try{sessionStorage.setItem('cometernel-tabs-swiped','yes');}catch{}};
 return <aside className="navigation-rail"><nav id="primary-navigation" ref={ref} className="primary-nav" aria-label="Navigation principale" onTouchStart={e=>{const p=e.touches[0];touch.current={x:p.clientX,y:p.clientY};}} onTouchMove={e=>{const start=touch.current,p=e.touches[0];if(start&&Math.abs(p.clientX-start.x)>24&&Math.abs(p.clientX-start.x)>Math.abs(p.clientY-start.y)){dismiss();touch.current=null;}}} onTouchEnd={()=>{touch.current=null;}} onWheel={e=>{if(Math.abs(e.deltaX)>10)dismiss();}}>{children}</nav>{overflow&&<div className={`navigation-swipe-hint${dismissed?' is-dismissed':''}`} aria-hidden={dismissed}><span aria-hidden="true" className="swipe-gesture">↔</span><span>Faites glisser les onglets de gauche à droite</span></div>}</aside>;
}
