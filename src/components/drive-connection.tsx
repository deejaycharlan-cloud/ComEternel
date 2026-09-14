import {eq} from 'drizzle-orm';
import {getDb} from '../db/client';
import {driveConnections} from '../db/production-schema';
export async function DriveConnection({organizationId,error}:{organizationId:string;error?:boolean}){
 const [c]=await getDb().select({email:driveConnections.googleEmail,rootId:driveConnections.rootId,status:driveConnections.status}).from(driveConnections).where(eq(driveConnections.organizationId,organizationId));
 const connected=c?.status==='connected';
 return <section className="card"><h2>Fichiers · Google Drive</h2><p>Les rushs et les livrables sont envoyés dans le Drive de votre association.</p><p className="drive-path">Multimédia ComÉternel → Année → Date et événement → Rushs ou Livrables → Photos ou Vidéos</p>
 {error&&<p className="notice" role="alert">Connexion non terminée. Réessayez en autorisant l’accès au Drive de l’association.</p>}
 {connected?<><p>Compte connecté : <strong>{c.email}</strong></p><a className="button secondary" href={`https://drive.google.com/drive/folders/${c.rootId}`} target="_blank" rel="noreferrer">Ouvrir les fichiers dans Drive ↗</a><details><summary>Renouveler la connexion</summary><p>Choisissez le même compte Google pour conserver l’accès aux fichiers existants.</p><form action="/api/google-drive/start" method="post"><input type="hidden" name="organizationId" value={organizationId}/><button>Reconnecter Google Drive</button></form></details></>:<><p>Aucun Drive connecté.</p><form action="/api/google-drive/start" method="post"><input type="hidden" name="organizationId" value={organizationId}/><button>Connecter Google Drive</button></form></>}
 </section>;
}
