 'use client';
import {useEffect,useState} from 'react';
export function ShareLink({path,label='Lien à partager'}:{path:string;label?:string}) {
 const [url,setUrl]=useState(path),[message,setMessage]=useState('');
 useEffect(()=>setUrl(new URL(path,window.location.origin).href),[path]);
 return <div className="section-spaced"><label>{label}<input value={url} readOnly onFocus={e=>e.target.select()}/></label><button type="button" className="secondary" onClick={async()=>{try{await navigator.clipboard.writeText(url);setMessage('Lien copié.');}catch{setMessage('Sélectionnez le lien ci-dessus pour le copier.');}}}>Copier le lien</button><p role="status">{message}</p></div>;
}
