import { parseArgs } from 'node:util';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { organizations } from '../src/db/schema';
import { user } from '../src/db/auth-schema';
import { members, accessAudit } from '../src/db/team-schema';
import { readConfig } from '../src/config/env';
const { values } = parseArgs({ options: { organization: { type: 'string' }, email: { type: 'string' } } });
const orgId = z.uuid().parse(values.organization); const email = z.email().parse(values.email).toLowerCase();
const pool = new Pool({ connectionString: readConfig().databaseUrl }); const db = drizzle(pool);
try {
  await db.transaction(async tx => {
    const [org] = await tx.select().from(organizations).where(eq(organizations.id, orgId)).for('update');
    if (!org) throw new Error('Espace absent.');
    const existing = await tx.select().from(members).where(eq(members.organizationId, orgId));
    if (existing.length) throw new Error('Espace déjà attribué : utilisez les accès dans l’application.');
    const [person] = await tx.select().from(user).where(eq(user.email, email));
    if (!person?.emailVerified) throw new Error('Connectez-vous d’abord avec cette adresse pour créer un compte vérifié.');
    await tx.insert(members).values({ organizationId: orgId, userId: person.id, role: 'admin', professions: ['administrateur'], permissions: [] });
    await tx.insert(accessAudit).values({ organizationId: orgId, actorId: person.id, action: 'legacy_space.explicit_local_assignment' });
  });
  console.log('Ancien espace attribué explicitement au compte indiqué.');
} catch (error) { console.error(error instanceof Error && !('query' in error) ? error.message : 'Attribution impossible. Aucune réinitialisation effectuée.'); process.exitCode = 1; }
finally { await pool.end(); }
