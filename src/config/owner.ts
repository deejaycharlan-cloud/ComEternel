type Identity = { email: string; emailVerified: boolean };
export function canCreateTeam(user: Identity, env: Record<string,string|undefined> = process.env) {
  if (!user.emailVerified) return false;
  if (env.COMETERNEL_DEPLOYMENT !== 'public' && env.VERCEL !== '1') return true;
  return Boolean(env.OWNER_EMAIL && user.email.toLowerCase() === env.OWNER_EMAIL.trim().toLowerCase());
}
