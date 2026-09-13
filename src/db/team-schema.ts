import { pgTable, uuid, text, timestamp, uniqueIndex, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from './schema';
import { user } from './auth-schema';
export const members = pgTable('members', {
  id: uuid('id').defaultRandom().primaryKey(), organizationId: uuid('organization_id').notNull().references(() => organizations.id), userId: text('user_id').notNull().references(() => user.id),
  role: text('role').notNull().default('member'), professions: text('professions').array().notNull().default(sql`ARRAY[]::text[]`),
  permissions: text('permissions').array().notNull().default(sql`ARRAY[]::text[]`), revokedAt: timestamp('revoked_at', { withTimezone: true }), createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, t => [uniqueIndex('member_org_user').on(t.organizationId, t.userId), check('member_role', sql`${t.role} in ('admin','member')`)]);
export const invitations = pgTable('invitations', {
  id: uuid('id').defaultRandom().primaryKey(), organizationId: uuid('organization_id').notNull().references(() => organizations.id), email: text('email').notNull(), tokenHash: text('token_hash').notNull().unique(), role: text('role').notNull(), professions: text('professions').array().notNull(), permissions: text('permissions').array().notNull(), createdBy: text('created_by').notNull().references(() => user.id), expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(), acceptedAt: timestamp('accepted_at', { withTimezone: true }), revokedAt: timestamp('revoked_at', { withTimezone: true }), createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, t => [check('invitation_role', sql`${t.role} in ('admin','member')`)]);
export const accessAudit = pgTable('access_audit', { id: uuid('id').defaultRandom().primaryKey(), organizationId: uuid('organization_id').notNull().references(() => organizations.id), actorId: text('actor_id').notNull().references(() => user.id), action: text('action').notNull(), targetId: text('target_id'), createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull() });
export const projectGrants = pgTable('project_grants', { id: uuid('id').defaultRandom().primaryKey(), memberId: uuid('member_id').notNull().references(() => members.id), projectId: uuid('project_id').notNull(), permission: text('permission').notNull() }, t => [uniqueIndex('project_grant_unique').on(t.memberId, t.projectId, t.permission)]);

export const joinCodes = pgTable('join_codes', {
  organizationId: uuid('organization_id').primaryKey().references(() => organizations.id),
  code: text('code').notNull().unique(),
});
export const joinRequests = pgTable('join_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  email: text('email').notNull(),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, t => [uniqueIndex('join_request_org_email').on(t.organizationId,t.email), check('join_request_status',sql`${t.status} in ('pending','approved','rejected')`)]);
