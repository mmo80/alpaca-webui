'use server';

import { db } from "@/db/db";
import { files } from "@/db/schema";
import { Documents, VectorDatabaseClassName, weaviateClient } from "@/db/vector-db";
import { eq } from "drizzle-orm";
import { Ollama } from 'ollama';

export type GetChunksRequest = {
  question:string;
  documentId: number;
  embedModel: string;
};

export const getChunks = async (request: GetChunksRequest): Promise<Documents[]> => {
  const dbResult = await db.select({ filename: files.filename }).from(files).where(eq(files.id, request.documentId));
  if (dbResult.length > 0) {
    const filename = dbResult[0].filename;

    const ollama = new Ollama({ host: 'http://localhost:11434' });
    const embedding = await ollama.embeddings({
      model: request.embedModel,
      prompt: request.question,
    });

    const documents = await filterVectorDatabaseDocuments(filename, embedding.embedding);
    return documents;
  }

  return [];
};

const filterVectorDatabaseDocuments = async (
  filename: string,
  embedding: number[],
  limit: number = 3,
): Promise<Documents[]> => {
  const result = await weaviateClient.graphql
    .get()
    .withClassName(VectorDatabaseClassName)
    .withNearVector({ vector: embedding })
    .withWhere({
      path: ['file'],
      operator: 'Equal',
      valueText: filename,
    })
    .withLimit(limit)
    .withFields('text chunkIndex chunkTotal _additional { distance }')
    .do();

  if (result === undefined || result.data === undefined || result.data.Get === undefined || result.data.Get.Documents === undefined) {
    return [];
  }

  return result.data.Get.Documents as Documents[];
};