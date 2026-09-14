'use client';
import {useState} from 'react';
import {Reason} from './work-fields';
export function StatusComment({options}:{options:{value:string;label:string}[]}) {
 const [value,setValue]=useState(options[0]?.value||'');
 return <><label>Nouvel état<select name="status" value={value} onChange={e=>setValue(e.target.value)}>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></label><Reason required={['blocked','refused','deferred','clarify'].includes(value)}/></>;
}
export function MissionResponse() {
 const [refuse,setRefuse]=useState(false);
 return <><label>Votre réponse<select name="answer" value={refuse?'refuse':'accept'} onChange={e=>setRefuse(e.target.value==='refuse')}><option value="accept">Accepter la mission</option><option value="refuse">Refuser la mission</option></select></label><Reason required={refuse}/><button>{refuse?'Confirmer le refus':'Accepter la mission'}</button></>;
}
