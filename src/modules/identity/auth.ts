import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { magicLink } from 'better-auth/plugins';
import { getDb } from '../../db/client';
import * as schema from '../../db/auth-schema';
import { sendMail } from './mail';
import { validatePublicDeployment } from '../../config/deployment';
export function createAuth(db: ReturnType<typeof getDb>, send = sendMail) {
  validatePublicDeployment();
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error('Configurez BETTER_AUTH_SECRET (32 caractères minimum).');
  return betterAuth({
    appName: 'ComÉternel', baseURL: process.env.BETTER_AUTH_URL || 'http://127.0.0.1:3100', secret,
    database: drizzleAdapter(db, { provider: 'pg', schema, transaction: true }),
    logger: { disabled: true },
    emailAndPassword: { enabled: true, minPasswordLength: 12, maxPasswordLength: 128, requireEmailVerification: true, revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => { await send(user.email, 'Réinitialiser votre mot de passe ComÉternel', `Utilisez ce lien personnel pour choisir un nouveau mot de passe.\n\n${url}`); } },
    emailVerification: { sendOnSignUp: true, sendOnSignIn: true, autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => { await send(user.email, 'Vérifier votre adresse ComÉternel', `Confirmez votre adresse email avec ce lien personnel.\n\n${url}`); } },
    account: { accountLinking: { enabled: false }, encryptOAuthTokens: true },
    session: { expiresIn: 60 * 60 * 24, freshAge: 300, cookieCache: { enabled: false } },
    socialProviders: process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? { google: { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET } } : {},
    rateLimit: { enabled: true, storage: 'database', window: 60, max: 60, customRules: { '/sign-in/magic-link': { window: 60, max: 3 }, '/sign-in/email': { window: 60, max: 10 }, '/sign-up/email': { window: 60, max: 3 }, '/request-password-reset': { window: 60, max: 3 } } },
    plugins: [magicLink({ expiresIn: 300, storeToken: 'hashed', sendMagicLink: async ({ email, url }) => { await send(email, 'Votre lien de connexion', `Ce lien personnel expire dans 5 minutes et ne sert qu'une fois.\n\n${url}`); } })],
  });
}
let instance: ReturnType<typeof createAuth> | undefined;
export function getAuth() { return instance ??= createAuth(getDb()); }
