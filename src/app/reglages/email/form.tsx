'use client';
import {useState,useTransition} from 'react';
import {testEmail} from './actions';
export function EmailTest(){const [message,setMessage]=useState(''),[pending,start]=useTransition();return <><button disabled={pending} onClick={()=>start(async()=>{try{setMessage((await testEmail()).message);}catch{setMessage('Envoi non confirmé. Réessayez.');}})}>{pending?'Envoi…':'Envoyer un email de test à mon adresse'}</button><p role="status">{message}</p></>;}
