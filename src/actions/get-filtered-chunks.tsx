'use server';

import { embedMessage } from "@/app/api/documents/embed/_components/embed-message";
import { db } from "@/db/db";
import { files } from "@/db/schema";
import { Documents, VectorDatabaseClassName, weaviateClient } from "@/db/vector-db";
import { eq } from "drizzle-orm";

export type GetChunksRequest = {
  question:string;
  documentId: number;
  embedModel: string;
  baseUrl: string | null;
  apiKey: string | null;
};

export const getFilteredChunks = async (request: GetChunksRequest): Promise<Documents[]> => {
  const dbResult = await db.select({ filename: files.filename }).from(files).where(eq(files.id, request.documentId));
  if (dbResult.length > 0) {
    const filename = dbResult[0].filename;
    
    const data = await embedMessage(request.question, request.embedModel, request.baseUrl, request.apiKey);
    const embeddings: number[] = data.embedding;

    const documents = await filterVectorDatabaseDocuments(filename, embeddings);
    return documents;
  }

  return [];
};

const filterVectorDatabaseDocuments = async (
  filename: string,
  embeddings: number[],
  limit: number = 3,
): Promise<Documents[]> => {
  const result = await weaviateClient.graphql
    .get()
    .withClassName(VectorDatabaseClassName)
    .withNearVector({ vector: embeddings })
    .withWhere({
      path: ['file'],
      operator: 'Equal',
      valueText: filename,
    })
    .withLimit(limit)
    .withFields('text chunkIndex chunkTotal totalTokens _additional { distance }')
    .do();

  if (result === undefined || result.data === undefined || result.data.Get === undefined || result.data.Get.Documents === undefined) {
    return [];
  }

  return result.data.Get.Documents as Documents[];
};