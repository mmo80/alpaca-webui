import { text, integer, sqliteTable } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const files = sqliteTable('files', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  filename: text('filename').notNull(),
  fileSize: integer('file_size', { mode: 'number' }),
  timestamp: text('timestamp').default(sql`(datetime('now','localtime'))`).notNull(),
  isEmbedded: integer('is_embedded', { mode: 'boolean' }).default(false).notNull(),
  embedModel: text('embed_model').default(''),
  embedApiServiceName: text('embed_api_service_name').default(''),
  textCharacterCount: integer('text_character_count', { mode: 'number' }).default(0),
  noOfChunks: integer('no_of_chunks', { mode: 'number' }).default(0),
});

const ZFileSchema = createSelectSchema(files);

export type TFile = z.infer<typeof ZFileSchema>;
