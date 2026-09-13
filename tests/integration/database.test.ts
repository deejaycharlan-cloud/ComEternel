import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { eq } from 'drizzle-orm';
import { organizations, jobs } from '../../src/db/schema';
const url = process.env.TEST_DATABASE_URL;
if (!url || !new URL(url).pathname.endsWith('_test') || url === process.env.DATABASE_URL) throw new Error('Utilisez une base dédiée suffixée _test.');
test('migrations, persistance, contraintes et isolation des clés de traitement', async () => {
  let pool = new Pool({ connectionString: url });
  const ids: string[] = [];
  try {
    let db = drizzle(pool);
    await migrate(db, { migrationsFolder: './drizzle' });
    const [a, b] = await db.insert(organizations).values([{ name: 'TEST A', timezone: 'UTC' }, { name: 'TEST B', timezone: 'Europe/Paris' }]).returning();
    ids.push(a.id, b.id);
    await pool.end();
    pool = new Pool({ connectionString: url });
    db = drizzle(pool);
    await migrate(db, { migrationsFolder: './drizzle' });
    assert.equal((await db.select().from(organizations).where(eq(organizations.id, a.id)))[0].name, 'TEST A');
    const job = { organizationId: a.id, kind: 'test', idempotencyKey: 'same-trigger', destination: { folder: 'fixed-test' }, payload: {} };
    await db.insert(jobs).values(job);
    await assert.rejects(db.insert(jobs).values(job));
    await db.insert(jobs).values({ ...job, organizationId: b.id });
    await assert.rejects(db.insert(jobs).values({ ...job, idempotencyKey: 'invalid-status', status: 'invented' }));
    await assert.rejects(db.insert(jobs).values({ ...job, idempotencyKey: 'missing-parent', organizationId: '00000000-0000-0000-0000-000000000000' }));
    await assert.rejects(db.delete(organizations).where(eq(organizations.id, a.id)));
    assert.equal((await db.select().from(organizations).where(eq(organizations.id, a.id))).length, 1);
  } finally {
    for (const id of ids) {
      await pool.query('delete from jobs where organization_id = $1', [id]);
      await pool.query('delete from organizations where id = $1', [id]);
    }
    await pool.end();
  }
});
