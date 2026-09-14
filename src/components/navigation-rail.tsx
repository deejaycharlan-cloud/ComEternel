'use client';
import {useEffect,useRef,useState} from 'react';
export function NavigationRail({children,routeKey}:{children:React.ReactNode;routeKey:string}) {
 const ref=useRef<HTMLElement>(null),touch=useRef<{x:number;y:number}|null>(null);
 const [overflow,setOverflow]=useState(false),[dismissed,setDismissed]=useState(true),[hintCycle,setHintCycle]=useState(0);
 useEffect(()=>{
  let timer:ReturnType<typeof setTimeout>;
  const reset=()=>{clearTimeout(timer);setDismissed(true);if(overflow&&document.visibilityState==='visible')timer=setTimeout(()=>{if(window.matchMedia('(max-width:700px)').matches){setHintCycle(n=>n+1);setDismissed(false);}},60000);};
  const events=['pointerdown','pointermove','touchstart','touchmove','keydown','wheel','scroll'];
  events.forEach(name=>document.addEventListener(name,reset,{passive:true,capture:true}));document.addEventListener('visibilitychange',reset);reset();
  return()=>{clearTimeout(timer);events.forEach(name=>document.removeEventListener(name,reset,true));document.removeEventListener('visibilitychange',reset);};
 },[overflow,routeKey]);
 useEffect(()=>{const nav=ref.current;if(!nav)return;const update=()=>setOverflow(nav.scrollWidth>nav.clientWidth+2);const observer=new ResizeObserver(update);observer.observe(nav);for(const child of nav.children)observer.observe(child);update();return()=>observer.disconnect();},[]);
 useEffect(()=>{const nav=ref.current;if(!nav||!window.matchMedia('(max-width:700px)').matches)return;const active=nav.querySelector<HTMLElement>('[aria-current="page"]');if(!active)return;const n=nav.getBoundingClientRect(),a=active.getBoundingClientRect();if(a.left<n.left)nav.scrollLeft-=n.left-a.left+12;else if(a.right>n.right)nav.scrollLeft+=a.right-n.right+12;},[routeKey]);
 const dismiss=()=>setDismissed(true);
 return <aside className="navigation-rail"><nav id="primary-navigation" ref={ref} className="primary-nav" aria-label="Navigation principale" onTouchStart={e=>{const p=e.touches[0];touch.current={x:p.clientX,y:p.clientY};}} onTouchMove={e=>{const start=touch.current,p=e.touches[0];if(start&&Math.abs(p.clientX-start.x)>24&&Math.abs(p.clientX-start.x)>Math.abs(p.clientY-start.y)){dismiss();touch.current=null;}}} onTouchEnd={()=>{touch.current=null;}} onWheel={e=>{if(Math.abs(e.deltaX)>10)dismiss();}}>{children}</nav>{overflow&&<div className={`navigation-swipe-hint${dismissed?' is-dismissed':''}`} aria-hidden={dismissed}><span aria-hidden="true" key={hintCycle} className="swipe-gesture">↔</span><span>Faites glisser les onglets de gauche à droite</span></div>}</aside>;
}
