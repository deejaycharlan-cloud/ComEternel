type Environment = Record<string, string | undefined>;

export function mailConfig(env: Environment = process.env) {
  if (env.AUTH_MAIL_MODE === 'local') {
    const origin = new URL(env.BETTER_AUTH_URL || 'http://127.0.0.1:3100');
    if (env.COMETERNEL_DEPLOYMENT === 'public' || !['127.0.0.1', 'localhost'].includes(origin.hostname)) {
      throw new Error('Le transport email local ne peut pas être exposé publiquement.');
    }
    return { host: '127.0.0.1', port: 51025, secure: false, local: true, from: 'ComÉternel local <connexion@cometernel.test>' };
  }
  if (env.AUTH_MAIL_MODE !== 'smtp') throw new Error('AUTH_MAIL_MODE doit être local ou smtp.');
  const port = Number(env.SMTP_PORT || '587');
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD || !env.SMTP_FROM || /[\r\n]/.test(env.SMTP_FROM) || ![465, 587].includes(port)) {
    throw new Error('Configuration SMTP incomplète ou invalide. Ports autorisés : 465 et 587.');
  }
  return { host: env.SMTP_HOST, port, secure: port === 465, local: false, from: env.SMTP_FROM,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }, requireTLS: true };
}

export function validatePublicDeployment(env: Environment = process.env) {
  if (env.COMETERNEL_DEPLOYMENT !== 'public') return;
  let origin: URL;
  try { origin = new URL(env.BETTER_AUTH_URL || ''); } catch { throw new Error('BETTER_AUTH_URL publique requise.'); }
  if (origin.protocol !== 'https:' || origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash || ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname)) throw new Error('BETTER_AUTH_URL doit être une origine HTTPS publique.');
  if (!env.BETTER_AUTH_SECRET || env.BETTER_AUTH_SECRET.length < 32) throw new Error('BETTER_AUTH_SECRET doit contenir au moins 32 caractères.');
  mailConfig(env);
  if (env.STORAGE_DRIVER !== 's3' || !env.S3_BUCKET || !env.S3_REGION) throw new Error('Stockage S3 privé requis pour ce déploiement public.');
  if (env.S3_ENDPOINT) {
    let endpoint: URL;
    try { endpoint = new URL(env.S3_ENDPOINT); } catch { throw new Error('S3_ENDPOINT invalide.'); }
    if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password) throw new Error('S3_ENDPOINT doit utiliser HTTPS sans identifiants dans l’URL.');
  }
}
