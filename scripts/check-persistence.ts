import { Pool } from 'pg';
import { readFile, writeFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';
const url = process.env.TEST_DATABASE_URL;
if (!url || !new URL(url).pathname.endsWith('_test') || url === process.env.DATABASE_URL) throw new Error('Base de test dédiée requise.');
const marker = join(tmpdir(), 'cometernel-persistence-e1.json');
const pool = new Pool({ connectionString: url });
try {
  if (process.argv[2] === 'before') {
    const { rows } = await pool.query("insert into organizations (name, timezone) values ('TEST redémarrage E1', 'UTC') returning id");
    await writeFile(marker, JSON.stringify(rows[0]));
    console.log('Donnée de test enregistrée avant arrêt.');
  } else if (process.argv[2] === 'after') {
    const { id } = JSON.parse(await readFile(marker, 'utf8'));
    const { rows } = await pool.query('select name from organizations where id = $1', [id]);
    assert.equal(rows[0]?.name, 'TEST redémarrage E1');
    await pool.query('delete from organizations where id = $1', [id]);
    await unlink(marker);
    console.log('Persistance après redémarrage PostgreSQL vérifiée ; donnée de test nettoyée.');
  } else throw new Error('Argument before ou after requis.');
} finally { await pool.end(); }
