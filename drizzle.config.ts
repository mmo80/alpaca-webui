import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: './db/local.db',
  },
  verbose: true,
  strict: true,
} satisfies Config;
