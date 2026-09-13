import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { readConfig } from '../src/config/env';
const pool = new Pool({ connectionString: readConfig().databaseUrl });
try {
  await migrate(drizzle(pool), { migrationsFolder: './drizzle' });
  console.log('Migrations appliquées.');
} catch {
  console.error('Migration impossible. Vérifiez la base et sa configuration. Aucune réinitialisation automatique.');
  process.exitCode = 1;
} finally { await pool.end(); }
