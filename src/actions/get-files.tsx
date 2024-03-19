'use server';

import { db } from '@/db/db';
import { files, TFileSchema } from '@/db/schema';

export const getFiles = async (): Promise<TFileSchema[]> => {
  return await db.select().from(files);
};
