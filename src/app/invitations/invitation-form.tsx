'use client';
import { useActionState, useState } from 'react';
import Link from 'next/link';
import { acceptInvitation } from './actions';
export function InvitationForm({ initialToken }: { initialToken: string }) { const [token, setToken] = useState(initialToken); const [state, action, pending] = useActionState(acceptInvitation, { status: 'idle' as const, message: '' }); return <form action={action}><label htmlFor="invitation-token">Code personnel de l’invitation</label><input id="invitation-token" name="token" value={token} onChange={e => setToken(e.target.value)} required autoComplete="off"/><button disabled={pending || state.status === 'success'}>{pending ? 'Vérification…' : 'Accepter l’invitation'}</button><p role={state.status === 'error' ? 'alert' : 'status'}>{state.message}</p>{state.status === 'success' && <Link href="/compte">Ouvrir mon compte →</Link>}</form>; }
