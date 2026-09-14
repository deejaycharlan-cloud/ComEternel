import {mailConfig} from '../../config/deployment';
import { LoginForm } from './login-form';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Connexion' };
export default async function Page({ searchParams }: { searchParams: Promise<{ erreur?: string; retour?:string;association?:string }> }) { const params=await searchParams;const retour=params.retour||'';const returnTo=/^\/(?:equipe|reglages)\?organisation=[a-f0-9-]{36}$/.test(retour)||/^\/invitations\?token=[\w-]{43}$/.test(retour)||retour==='/invitations'?retour:'/compte';let mailEnabled=false;try{mailConfig();mailEnabled=true;}catch{} return <LoginForm joinCode={/^[a-fA-F0-9]{16}$/.test(params.association||'')?params.association!.toUpperCase():''} returnTo={returnTo} linkError={Boolean((await searchParams).erreur)} googleEnabled={Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)} mailEnabled={mailEnabled} localMail={process.env.AUTH_MAIL_MODE === 'local'}/>; }
