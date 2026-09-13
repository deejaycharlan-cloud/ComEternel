import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { readConfig } from '../config/env';
import * as core from './schema';
import * as auth from './auth-schema';
import * as team from './team-schema';
import * as programme from './programme-schema';
import * as work from './work-schema';
import * as production from './production-schema';
const schema = { ...core, ...auth, ...team, ...programme, ...work, ...production };
const globalDb = globalThis as unknown as { pool?: Pool };
export function getDb() {
  if (!globalDb.pool) {
    globalDb.pool = new Pool({ connectionString: readConfig().databaseUrl, max: 5, connectionTimeoutMillis: 3000 });
    globalDb.pool.on('error', () => console.error('Connexion à la base interrompue.'));
  }
  const pool = globalDb.pool;
  return drizzle(pool, { schema });
}
