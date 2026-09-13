import { pgTable, uuid, text, timestamp, integer, jsonb, uniqueIndex, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  timezone: text('timezone').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [check('organization_name_nonempty', sql`length(trim(${table.name})) between 2 and 120`)]);
export const jobs = pgTable('jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'restrict' }),
  kind: text('kind').notNull(),
  idempotencyKey: text('idempotency_key').notNull(),
  destination: jsonb('destination').notNull(),
  payload: jsonb('payload').notNull(),
  status: text('status').default('pending').notNull(),
  attempts: integer('attempts').default(0).notNull(),
  availableAt: timestamp('available_at', { withTimezone: true }).defaultNow().notNull(),
  lastErrorCode: text('last_error_code'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [uniqueIndex('jobs_organization_idempotency').on(table.organizationId, table.idempotencyKey), check('jobs_status', sql`${table.status} in ('pending', 'running', 'succeeded', 'failed', 'suspended')`), check('jobs_attempts', sql`${table.attempts} >= 0`)]);
