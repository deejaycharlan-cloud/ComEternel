import { getAuth } from '../../../../modules/identity/auth';
export const dynamic = 'force-dynamic';
async function handle(request: Request) {
  // Ne faire confiance à aucun en-tête IP fourni directement au serveur local.
  const headers = new Headers(request.headers);
  headers.set('x-forwarded-for', '127.0.0.1');
  headers.delete('x-real-ip');
  try { return await getAuth().handler(new Request(request, { headers })); }
  catch (error) {
    // Ne jamais journaliser le message, la requête SQL ou les paramètres.
    const allowedCodes = new Set(['28P01', '28000', '42P01', '42703', '42501', 'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'SELF_SIGNED_CERT_IN_CHAIN', 'DEPTH_ZERO_SELF_SIGNED_CERT', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'CERT_HAS_EXPIRED']);
    let cause: unknown = error;
    let code = 'UNKNOWN';
    for (let depth = 0; depth < 5 && cause && typeof cause === 'object'; depth++) {
      const item = cause as { code?: unknown; cause?: unknown };
      if (typeof item.code === 'string' && allowedCodes.has(item.code)) { code = item.code; break; }
      cause = item.cause;
    }
    console.error('AUTH_UNAVAILABLE', { code });
    return Response.json({ message: 'Connexion indisponible. Réessayez plus tard.' }, { status: 503 });
  }
}
export { handle as GET, handle as POST };
