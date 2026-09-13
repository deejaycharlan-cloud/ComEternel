import { getAuth } from '../../../../modules/identity/auth';
export const dynamic = 'force-dynamic';
async function handle(request: Request) {
  // Ne faire confiance à aucun en-tête IP fourni directement au serveur local.
  const headers = new Headers(request.headers);
  headers.set('x-forwarded-for', '127.0.0.1');
  headers.delete('x-real-ip');
  try { return await getAuth().handler(new Request(request, { headers })); }
  catch { return Response.json({ message: 'Connexion indisponible. Réessayez plus tard.' }, { status: 503 }); }
}
export { handle as GET, handle as POST };
