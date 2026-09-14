import {and,eq,isNull,sql} from 'drizzle-orm';
import type {getDb} from '../../db/client';
import {organizations} from '../../db/schema';
import {members,organizationDeletions,joinRequests,projectGrants} from '../../db/team-schema';
import {projects} from '../../db/programme-schema';
import {AccessError,type Actor} from './service';
// A navigation summary, not an authorization token: writes still check current rights.
export async function workspaceSummary(db:Pick<ReturnType<typeof getDb>,'select'>,actor:Actor){
 if(!actor.user.emailVerified)throw new AccessError();
 return db.select({
  id:organizations.id,name:organizations.name,timezone:organizations.timezone,role:members.role,
  deletionDate:organizationDeletions.dueAt,
  pendingRequests:sql<number>`case when ${members.role} = 'admin' then
   (select count(*)::int from ${joinRequests} where ${joinRequests.organizationId} = ${organizations.id} and ${joinRequests.status} = 'pending') else 0 end`,
  canCreate:sql<boolean>`${members.role} = 'admin' or 'project.edit' = any(${members.permissions})`,
  canRead:sql<boolean>`exists(select 1 from ${projects} where ${projects.organizationId} = ${organizations.id} and
   (${members.role} = 'admin' or ((${members.permissions} && ARRAY['project.read','project.edit']::text[]) and
    exists(select 1 from ${projectGrants} where ${projectGrants.memberId} = ${members.id} and ${projectGrants.projectId} = ${projects.id} and ${projectGrants.permission} in ('project.read','project.edit')))))`,
 }).from(members).innerJoin(organizations,eq(organizations.id,members.organizationId))
 .leftJoin(organizationDeletions,eq(organizationDeletions.organizationId,organizations.id))
 .where(and(eq(members.userId,actor.user.id),isNull(members.revokedAt)));
}
