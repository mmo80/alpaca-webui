import { text, integer, sqliteTable } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const files = sqliteTable('files', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  filename: text('filename').notNull(),
  fileSize: integer('file_size', { mode: 'number' }),
  timestamp: text('timestamp').default(sql`CURRENT_TIMESTAMP`),
});

const ZFileSchema = createSelectSchema(files);

// const ZFileSchema = createSelectSchema(files, {
//   id: (schema) => schema.id.nullable().default(null),
//   //timestamp: (schema) => schema.timestamp.nullable().default(null),
//   timestamp: z.date().nullable().default(null),
// });

export type TFileSchema = z.infer<typeof ZFileSchema>;

// url: https://orm.drizzle.team/docs/zod