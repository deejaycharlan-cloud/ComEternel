import {and,eq,isNull} from 'drizzle-orm';
import {z} from 'zod';
import {rushWindowOpen} from './rush-window';
import {getDb} from '../../db/client';
import {members,projectGrants} from '../../db/team-schema';
import {projects,occurrences} from '../../db/programme-schema';
import {organizations} from '../../db/schema';
import {AccessError,type Actor} from '../team/service';
export type DB=ReturnType<typeof getDb>;export type Tx=Parameters<Parameters<DB['transaction']>[0]>[0];export type Conn=DB|Tx;
export class ProductionError extends Error {}
export async function lock(c:Tx,org:string){z.uuid().parse(org);await c.select({id:organizations.id}).from(organizations).where(eq(organizations.id,org)).for('update');}
export async function access(c:Conn,a:Actor,org:string,project:string,mode:'read'|'edit'|'validate'='read'){
 z.uuid().parse(org);z.uuid().parse(project);if(!a.user.emailVerified)throw new AccessError();
 const [m]=await c.select().from(members).where(and(eq(members.organizationId,org),eq(members.userId,a.user.id),isNull(members.revokedAt)));
 const [p]=await c.select().from(projects).where(and(eq(projects.organizationId,org),eq(projects.id,project)));
 if(!m||!p)throw new AccessError();const gs=await c.select().from(projectGrants).where(and(eq(projectGrants.memberId,m.id),eq(projectGrants.projectId,project)));
 const global=mode==='validate'?m.permissions.includes('content.validate'):m.role==='admin'||m.permissions.includes('project.edit')||(mode==='read'&&m.permissions.includes('project.read'));
 const scoped=(m.role==='admin'&&mode!=='validate')||gs.some(g=>mode==='validate'?g.permission==='content.validate':g.permission==='project.edit'||(mode==='read'&&g.permission==='project.read'));
 if(!global||!scoped)throw new AccessError();return {m,p};
}
export async function active(c:Conn,p:typeof projects.$inferSelect,occurrenceId:string|null){if(p.status!=='preparation')throw new ProductionError('Projet annulé ou archivé : opération suspendue.');if(occurrenceId){z.uuid().parse(occurrenceId);const [e]=await c.select().from(occurrences).where(and(eq(occurrences.id,occurrenceId),eq(occurrences.projectId,p.id)));if(!e||e.status==='cancelled')throw new ProductionError('Occurrence annulée ou indisponible.');}}

export async function requireRushWindow(c:Conn,p:typeof projects.$inferSelect,occurrenceId:string|null) {
 await active(c,p,occurrenceId);
 if(p.kind!=='event'||!occurrenceId)throw new ProductionError('Choisissez la date de l’événement capté. Pour une création préparée en amont, utilisez Contenus et livrables.');
 const [event]=await c.select().from(occurrences).where(and(eq(occurrences.id,occurrenceId),eq(occurrences.projectId,p.id)));
 if(!event||!rushWindowOpen(event,p.timezone))throw new ProductionError('Les rushs peuvent être déposés à partir du début de l’événement, puis après celui-ci. Les flyers et vidéos préparatoires se déposent dans Contenus et livrables.');
}
