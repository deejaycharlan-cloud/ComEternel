'use client';
import { useEffect,useRef,useState,useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { workAction,type WorkState } from '../app/taches/actions';
export function WorkForm({children,fields}:{children:React.ReactNode;fields:Record<string,string|number>}){
 const feedback=useRef<HTMLParagraphElement>(null);
 const [state,setState]=useState<WorkState>({status:'idle',message:''});const [pending,start]=useTransition();const router=useRouter();
 useEffect(()=>{if(state.status==='error'){feedback.current?.focus();feedback.current?.scrollIntoView({block:'center',behavior:'auto'});}},[state]);
 return <form onSubmit={e=>{e.preventDefault();const data=new FormData(e.currentTarget);const submitter=(e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement|null;if(submitter?.name)data.set(submitter.name,submitter.value);start(async()=>{try{const result=await workAction(state,data);setState(result);if(result.status==='success'){if(fields.operation==='create'&&result.href){router.push(result.href,{scroll:true});}else router.refresh();}}catch{setState({status:'error',message:'Connexion interrompue. Vos saisies sont conservées.'});}});}}>{Object.entries(fields).map(([name,value])=><input key={name} type="hidden" name={name} value={value}/>)}<fieldset className="form-body" disabled={pending||state.status==='success'}>{children}</fieldset><p ref={feedback} tabIndex={-1} role={state.status==='error'?'alert':'status'}>{pending?'Enregistrement…':state.message}</p>{state.href&&<Link className="button secondary" href={state.href}>Continuer →</Link>}</form>;
}
