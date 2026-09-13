import { defineConfig } from 'drizzle-kit';
export default defineConfig({ dialect: 'postgresql', schema: ['./src/db/schema.ts', './src/db/auth-schema.ts', './src/db/team-schema.ts', './src/db/programme-schema.ts', './src/db/work-schema.ts', './src/db/production-schema.ts'], out: './drizzle' });
