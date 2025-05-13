import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { settings, type TSettings } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import { Constants } from '@/lib/constants';
import type { TProviderSettings } from '@/lib/types';
import { decrypt, encrypt } from '@/lib/crypto';

export const SettingInputSchema = z.object({
  key: z.string(),
  value: z.string(),
});

export const SettingKeySchema = z.object({
  key: z.string(),
});

export const settingRouter = createTRPCRouter({
  all: publicProcedure.query(async ({ ctx }): Promise<TSettings[]> => {
    const result = await ctx.db.select().from(settings).orderBy(desc(settings.key));

    if (!result || result.length === 0) {
      return [];
    }

    const providerSetting = result.find((setting) => setting.key === Constants.settingKeys.providers);
    const providersJsonString = providerSetting?.value;
    if (providersJsonString) {
      try {
        const data = JSON.parse(providersJsonString) as TProviderSettings[];
        data.forEach((provider) => {
          if (provider.apiKey && provider.apiKey.length > 0) {
            provider.apiKey = decrypt(provider.apiKey);
          }
        });
        const jsonString = JSON.stringify(data);
        providerSetting.value = jsonString;
      } catch (error) {
        console.error('Error parsing provider settings:', error);
        // If JSON parsing fails, set to empty array to prevent errors
        providerSetting.value = JSON.stringify([]);
      }
    }

    return result;
  }),
  get: publicProcedure.input(SettingKeySchema).query(async ({ ctx, input }) => {
    const result = await ctx.db.select().from(settings).where(eq(settings.key, input.key));
    return result?.[0];
  }),
  insertUpdate: publicProcedure.input(SettingInputSchema).mutation(async ({ ctx, input }) => {
    const { key, value: inputValue } = input;
    let value = inputValue;

    const data = ctx.db.select({ id: settings.id }).from(settings).where(eq(settings.key, key)).get();

    if (key === Constants.settingKeys.providers && value) {
      const providers = JSON.parse(value) as TProviderSettings[];
      providers.forEach((provider) => {
        if (provider.apiKey && provider.apiKey.length > 0) {
          provider.apiKey = encrypt(provider.apiKey);
        }
      });
      value = JSON.stringify(providers);
    }

    if (!data?.id) {
      const result = await ctx.db
        .insert(settings)
        .values({
          id: uuidv7(),
          key: key,
          value: value,
        })
        .returning({ id: settings.id });

      return result?.[0]?.id;
    }

    const result = await ctx.db
      .update(settings)
      .set({ value: value })
      .where(eq(settings.id, data.id))
      .returning({ id: settings.id });

    return result?.[0]?.id;
  }),
});
