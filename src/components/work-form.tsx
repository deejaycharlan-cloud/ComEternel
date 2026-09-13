'use client';
import { useState,useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { workAction,type WorkState } from '../app/taches/actions';
export function WorkForm({children,fields}:{children:React.ReactNode;fields:Record<string,string|number>}){
 const [state,setState]=useState<WorkState>({status:'idle',message:''});const [pending,start]=useTransition();const router=useRouter();
 return <form onSubmit={e=>{e.preventDefault();const data=new FormData(e.currentTarget);const submitter=(e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement|null;if(submitter?.name)data.set(submitter.name,submitter.value);start(async()=>{try{const result=await workAction(state,data);setState(result);if(result.status==='success')router.refresh();}catch{setState({status:'error',message:'Connexion interrompue. Vos saisies sont conservées.'});}});}}>{Object.entries(fields).map(([name,value])=><input key={name} type="hidden" name={name} value={value}/>)}<fieldset className="form-body" disabled={pending||state.status==='success'}>{children}</fieldset><p role={state.status==='error'?'alert':'status'}>{pending?'Enregistrement…':state.message}</p>{state.href&&<Link className="button secondary" href={state.href}>Continuer →</Link>}</form>;
}
