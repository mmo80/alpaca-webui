'use server';

import { db } from '@/db/db';
import { files, TFile } from '@/db/schema';

export const getFiles = async (): Promise<TFile[]> => {
  return await db.select().from(files);
};
