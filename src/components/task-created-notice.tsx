'use client';
import {useEffect,useRef} from 'react';
export function TaskCreatedNotice(){
 const notice=useRef<HTMLParagraphElement>(null);
 useEffect(()=>{window.scrollTo({top:0,behavior:'instant'});notice.current?.focus({preventScroll:true});},[]);
 return <p ref={notice} tabIndex={-1} className="notice" role="status">✓ Tâche créée avec succès. Vous êtes sur sa fiche.</p>;
}
