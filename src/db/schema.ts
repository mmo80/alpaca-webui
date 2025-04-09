import { text, integer, sqliteTable } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const files = sqliteTable('files', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  filename: text('filename').notNull(),
  fileSize: integer('file_size', { mode: 'number' }),
  timestamp: text('timestamp')
    .default(sql`(datetime('now','localtime'))`)
    .notNull(),
  isEmbedded: integer('is_embedded', { mode: 'boolean' }).default(false).notNull(),
  embedModel: text('embed_model').default(''),
  embedApiServiceName: text('embed_api_service_name').default(''),
  textCharacterCount: integer('text_character_count', { mode: 'number' }).default(0),
  noOfChunks: integer('no_of_chunks', { mode: 'number' }).default(0),
  noOfTokens: integer('no_of_tokens', { mode: 'number' }).default(0),
});
const ZFileSchema = createSelectSchema(files);
export type TFile = z.infer<typeof ZFileSchema>;

export const chatHistories = sqliteTable('chat_histories', {
  id: text('id').primaryKey(),
  title: text('title'),
  messages: text('messages').notNull(), // .$type<{ role: string; content: string }[]>()
  timestamp: text('timestamp')
    .default(sql`(datetime('now','localtime'))`)
    .notNull(),
  groupId: text('group_id').references(() => chatHistoryGroups.id),
});
export const chatHistorySchema = createSelectSchema(chatHistories);
export type TChatHistory = z.infer<typeof chatHistorySchema>;

export const chatHistoryGroups = sqliteTable('chat_history_groups', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  timestamp: text('timestamp')
    .default(sql`(datetime('now','localtime'))`)
    .notNull(),
});
export const chatHistoryGroupsSchema = createSelectSchema(chatHistoryGroups);

/*
const chatData = await db.select().from(chatHistory).where(eq(chatHistory.id, someChatId));
// Assuming chatData contains the serialized JSON string
const parsedMessages = JSON.parse(chatData[0].messages);
console.log(parsedMessages); // You now have an array of objects [{ role: 'developer', content: 'You are a helpful assistant.' }, { role: 'user', content: 'Hello!' }]
*/
