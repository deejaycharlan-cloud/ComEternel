import { z } from 'zod';
const databaseUrl = z.string().url().refine(value => ['postgres:', 'postgresql:'].includes(new URL(value).protocol));
export function readConfig(env: Record<string, string | undefined> = process.env) {
  const result = databaseUrl.safeParse(env.DATABASE_URL);
  if (!result.success) throw new Error('DATABASE_URL absente ou invalide. Consultez .env.example.');
  return { databaseUrl: result.data };
}
