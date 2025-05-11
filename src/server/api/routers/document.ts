import { createTRPCRouter, publicProcedure } from '../trpc';
import { promises as fs } from 'fs';
import { files, type TFile } from '@/db/schema';
import { fileUploadFolder } from '@/lib/providers/data';
import { ProviderSettingsSchema } from '@/lib/types';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import path from 'path';
import { VectorDatabase } from '@/server/vector-database';
import { DocumentEmbedding } from '@/server/document-embedding';
import { embedMessage } from '@/server/embed-message';

export const DocumentChunkRequestSchema = z.object({
  question: z.string(),
  documentId: z.string(),
  embedModel: z.string(),
  providerSetting: ProviderSettingsSchema,
});
export type TDocumentChunkRequest = z.infer<typeof DocumentChunkRequestSchema>;

export const DocumentIdRequestSchema = z.object({
  documentId: z.string(),
});
export type TDocumentIdRequest = z.infer<typeof DocumentIdRequestSchema>;

export const DocumentEmbedRequestSchema = z.object({
  documentId: z.string(),
  embedModel: z.string(),
  providerSetting: ProviderSettingsSchema,
});
export type TDocumentEmbedRequest = z.infer<typeof DocumentEmbedRequestSchema>;

const vectorDb = new VectorDatabase();

export const documentRouter = createTRPCRouter({
  all: publicProcedure.query(async ({ ctx }): Promise<TFile[]> => {
    return await ctx.db.select().from(files);
  }),
  get: publicProcedure.input(DocumentIdRequestSchema).query(async ({ ctx, input }): Promise<TFile> => {
    const { documentId } = input;
    const dbResult = await ctx.db.select({ file: files }).from(files).where(eq(files.id, documentId));

    if (dbResult.length === 0 || !dbResult[0]) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `Document with ID ${documentId} not found`,
      });
    }

    return dbResult[0].file;
  }),
  getDocumentChunks: publicProcedure.input(DocumentChunkRequestSchema).query(async ({ ctx, input }) => {
    const { question, documentId, embedModel, providerSetting } = input;

    const dbResult = await ctx.db.select({ filename: files.filename }).from(files).where(eq(files.id, documentId));
    if (dbResult.length > 0) {
      const filename = dbResult[0]!.filename;
      const data = await embedMessage(question, embedModel, providerSetting);
      const embeddings: number[] = data.embedding;
      const documents = await vectorDb.filterDocuments(filename, embeddings);
      return documents;
    }

    console.warn('Document not found: ', documentId);
    return [];
  }),
  remove: publicProcedure.input(DocumentIdRequestSchema).mutation(async ({ ctx, input }) => {
    const { documentId } = input;

    const dbResult = await ctx.db
      .select({ filename: files.filename, embedded: files.isEmbedded })
      .from(files)
      .where(eq(files.id, documentId));

    if (dbResult.length === 0) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `Document with ID ${documentId} not found`,
      });
    }

    const filename = dbResult[0]!.filename;
    const isEmbedded = dbResult[0]!.embedded;
    const deleteResult = await ctx.db.delete(files).where(eq(files.id, documentId)).returning({ id: files.id });

    if (deleteResult.length !== 1 || deleteResult[0]!.id !== documentId) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Could not delete file ${documentId} from db.`,
      });
    }

    if (isEmbedded) {
      const vResult = await vectorDb.deleteDocuments(filename);
      if (!vResult) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Could not delete file ${documentId} from vector database.`,
        });
      }
    }

    // Remove File From Disk
    try {
      const filePath = path.join(fileUploadFolder, filename);
      await fs.unlink(filePath);
    } catch (error) {
      console.error(`Error removing file ${filename}:`, error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Error removing file from disk '${filename}'.`,
      });
    }
  }),
  embed: publicProcedure.input(DocumentEmbedRequestSchema).mutation(async ({ ctx, input }) => {
    const { documentId, embedModel, providerSetting } = input;

    const result = await ctx.db.select({ filename: files.filename }).from(files).where(eq(files.id, documentId));

    if (result.length === 0) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Document not found',
      });
    }

    const filename = result[0]!.filename;

    try {
      const documentEmbedding = new DocumentEmbedding(filename);
      const response = await documentEmbedding.EmbedAndPersistDocument(embedModel, providerSetting);

      if (!response.success) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to embed document',
          cause: response,
        });
      }

      const updateResult = await ctx.db
        .update(files)
        .set({
          isEmbedded: true,
          embedModel: embedModel,
          embedProviderName: providerSetting.providerId,
          noOfChunks: response.noOfChunks,
          textCharacterCount: response.textCharacterCount,
          noOfTokens: response.totalDocumentTokens,
        })
        .where(eq(files.id, documentId));

      if (updateResult.changes <= 0) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update database with embedding information',
        });
      }
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      let errorMessage = 'Unknown error occurred during document embedding';

      if (error instanceof Error) {
        errorMessage = error.message;
        console.error('Embedding error:', error);
      }

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: errorMessage,
        cause: error,
      });
    }
  }),
});
