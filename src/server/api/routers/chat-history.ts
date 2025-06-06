import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { chatHistories, type TChatHistory } from '@/db/schema';
import { CustomMessageSchema } from '@/lib/types';
import { eq, desc } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';

export const ChatHistoryInputSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  messages: z.array(CustomMessageSchema),
});

export const ChatHistoryTitleInputSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
});

export const ChatHistoryIdSchema = z.object({
  id: z.string(),
});

export const chatHistoryRouter = createTRPCRouter({
  all: publicProcedure.query(async ({ ctx }): Promise<TChatHistory[]> => {
    const result = await ctx.db.select().from(chatHistories).orderBy(desc(chatHistories.timestamp));

    if (!result || result.length === 0) {
      return [];
    }

    return result;
  }),
  get: publicProcedure.input(ChatHistoryIdSchema).query(async ({ ctx, input }) => {
    const result = await ctx.db.select().from(chatHistories).where(eq(chatHistories.id, input.id));
    return result?.[0];
  }),
  insertUpdate: publicProcedure.input(ChatHistoryInputSchema).mutation(async ({ ctx, input }) => {
    const { id, title, messages } = input;

    const messagesString = JSON.stringify(messages);

    if (!id) {
      const result = await ctx.db
        .insert(chatHistories)
        .values({
          id: uuidv7(),
          title: title,
          messages: messagesString,
        })
        .returning({ updatedId: chatHistories.id });

      return result?.[0]?.updatedId;
    }

    const result = await ctx.db
      .update(chatHistories)
      .set({ title: title, messages: messagesString })
      .where(eq(chatHistories.id, id))
      .returning({ updatedId: chatHistories.id });

    return result?.[0]?.updatedId;
  }),
  updateTitle: publicProcedure.input(ChatHistoryTitleInputSchema).mutation(async ({ ctx, input }) => {
    const { id, title } = input;

    if (!id) {
      return null;
    }

    const result = await ctx.db
      .update(chatHistories)
      .set({ title: title })
      .where(eq(chatHistories.id, id))
      .returning({ updatedId: chatHistories.id });

    return result?.[0]?.updatedId;
  }),
  remove: publicProcedure.input(ChatHistoryIdSchema).mutation(async ({ ctx, input }) => {
    const { id } = input;
    await ctx.db.delete(chatHistories).where(eq(chatHistories.id, id));
  }),
});
