'use client';
import {useEffect,useRef,useState} from 'react';
export function NavigationRail({children,routeKey}:{children:React.ReactNode;routeKey:string}) {
 const ref=useRef<HTMLElement>(null),[edges,setEdges]=useState({left:false,right:false});
 useEffect(()=>{const nav=ref.current;if(!nav)return;
  const update=()=>setEdges({left:nav.scrollLeft>2,right:nav.scrollWidth-nav.clientWidth-nav.scrollLeft>2});
  const observer=new ResizeObserver(update);observer.observe(nav);for(const child of nav.children)observer.observe(child);
  nav.addEventListener('scroll',update,{passive:true});update();return()=>{observer.disconnect();nav.removeEventListener('scroll',update);};
 },[]);
 useEffect(()=>{const nav=ref.current;if(!nav||!window.matchMedia('(max-width:700px)').matches)return;const active=nav.querySelector<HTMLElement>('[aria-current="page"]');if(!active)return;const n=nav.getBoundingClientRect(),a=active.getBoundingClientRect();if(a.left<n.left)nav.scrollLeft-=n.left-a.left+12;else if(a.right>n.right)nav.scrollLeft+=a.right-n.right+12;},[routeKey]);
 const move=(direction:number)=>{const nav=ref.current;if(nav)nav.scrollBy({left:direction*nav.clientWidth*.75,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});};
 return <aside className="navigation-rail"><nav id="primary-navigation" ref={ref} className="primary-nav" aria-label="Navigation principale">{children}</nav><div className="navigation-scroll-controls" hidden={!edges.left&&!edges.right}><button type="button" disabled={!edges.left} onClick={()=>move(-1)} aria-label="Afficher les rubriques précédentes" aria-controls="primary-navigation">←</button><span>Faites glisser les onglets de gauche à droite</span><button type="button" disabled={!edges.right} onClick={()=>move(1)} aria-label="Afficher les rubriques suivantes" aria-controls="primary-navigation">→</button></div></aside>;
}
