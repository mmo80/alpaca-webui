import { VectorDatabaseClassName, weaviateClient, type Documents } from '@/db/vector-db';

export class VectorDatabase {
  async filterDocuments(filename: string, embeddings: number[], limit: number = 5): Promise<Documents[]> {
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

    return (result?.data?.Get?.Documents as Documents[]) ?? [];
  }

  async deleteDocuments(filename: string): Promise<boolean> {
    const result = await weaviateClient.batch
      .objectsBatchDeleter()
      .withClassName(VectorDatabaseClassName)
      .withWhere({
        path: ['file'],
        operator: 'Equal',
        valueText: filename,
      })
      .do();

    return (result.results?.successful ?? 0) > 0;
  }
}
