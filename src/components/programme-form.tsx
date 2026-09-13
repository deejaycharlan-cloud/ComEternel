'use client';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { programmeAction, type ProgrammeState } from '../app/projets/actions';
export function ProgrammeForm({ children, fields }: { children: React.ReactNode; fields: Record<string, string | number> }) {
  const [state, setState] = useState<ProgrammeState>({ status: 'idle', message: '' }); const [pending, start] = useTransition();
  return <form onSubmit={e => { e.preventDefault(); const data = new FormData(e.currentTarget); const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null; if (submitter?.name) data.set(submitter.name, submitter.value); start(async () => { try { setState(await programmeAction(state, data)); } catch { setState({ status: 'error', message: 'Connexion interrompue. Vos saisies sont conservées ; réessayez.' }); } }); }}>
    {Object.entries(fields).map(([key, value]) => <input type="hidden" key={key} name={key} value={value}/>)}<fieldset disabled={pending || state.status === 'success'} className="form-body">{children}</fieldset><p role={state.status === 'error' ? 'alert' : 'status'}>{pending ? 'Enregistrement en cours…' : state.message}</p>{state.href && <Link className="button" href={state.href}>Ouvrir le projet →</Link>}
  </form>;
}
