import { createTRPCRouter, publicProcedure } from '../trpc';
import { files } from '@/db/schema';

export const filesRouter = createTRPCRouter({
  all: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.select().from(files);
  }),
});
