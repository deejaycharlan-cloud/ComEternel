'use client';
import { useActionState, useState } from 'react';
import { TimezoneField } from '../components/timezone-field';
import { createOrganization, type FormState } from './actions';
const initial: FormState = { status: 'idle', message: '' };
export function SetupForm() {
  const [state, action, pending] = useActionState(createOrganization, initial);
  const [name, setName] = useState('');
  return <form action={action}>
    <label htmlFor="name">Nom de l’espace</label>
    <input id="name" name="name" value={name} onChange={e => setName(e.target.value)} required minLength={2} maxLength={120} placeholder="Nom de votre association" />
    <TimezoneField label="Fuseau horaire de l’association"/>
    <button disabled={pending || state.status === 'success'}>{pending ? 'Enregistrement…' : state.status === 'success' ? 'Espace enregistré' : 'Créer mon association'}</button>
    <p role={state.status === 'error' ? 'alert' : 'status'}>{state.message}</p>
  </form>;
}
