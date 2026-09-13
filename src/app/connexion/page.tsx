import { LoginForm } from './login-form';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Connexion' };
export default async function Page({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) { return <LoginForm linkError={Boolean((await searchParams).erreur)} googleEnabled={Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)} mailEnabled={['local', 'smtp'].includes(process.env.AUTH_MAIL_MODE || '')} localMail={process.env.AUTH_MAIL_MODE === 'local'}/>; }
