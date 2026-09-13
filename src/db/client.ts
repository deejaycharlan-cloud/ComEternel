import { Pool } from 'pg';
import { supabaseCa } from './supabase-ca';
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
    const url = new URL(readConfig().databaseUrl);
    const isSupabase = url.hostname.endsWith('.pooler.supabase.com') || url.hostname.endsWith('.supabase.co');
    if (isSupabase) for (const key of ['sslmode','sslcert','sslkey','sslrootcert','uselibpqcompat']) url.searchParams.delete(key);
    globalDb.pool = new Pool({ connectionString: url.toString(), ...(isSupabase ? { ssl: { ca: supabaseCa, rejectUnauthorized: true } } : {}), max: 5, connectionTimeoutMillis: 5000 });
    globalDb.pool.on('error', () => console.error('Connexion à la base interrompue.'));
  }
  const pool = globalDb.pool;
  return drizzle(pool, { schema });
}
