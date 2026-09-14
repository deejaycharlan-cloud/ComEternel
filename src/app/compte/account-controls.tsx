'use client';
import { useState } from 'react';
import { authClient } from '../../modules/identity/client';
export function SignOut() { const [error, setError] = useState(''); return <><button className="secondary" onClick={async () => { try { const result = await authClient.signOut(); if (result.error) throw new Error(); window.location.assign('/'); } catch { setError('La déconnexion a échoué. Réessayez.'); } }}>Me déconnecter</button><p role="alert">{error}</p></>; }
