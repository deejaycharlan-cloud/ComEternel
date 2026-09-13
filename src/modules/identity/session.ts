import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAuth } from './auth';
export async function currentSession() {
  // Resolve the request before initializing runtime secrets or database clients.
  const requestHeaders = await headers();
  return getAuth().api.getSession({ headers: requestHeaders });
}
export async function requireSession() {
  const value = await currentSession();
  if (!value || !value.user.emailVerified) redirect('/connexion');
  return value;
}
