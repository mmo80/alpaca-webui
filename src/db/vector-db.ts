import weaviate, { WeaviateClient } from 'weaviate-ts-client';

export const VectorDatabaseClassName = 'Documents';

export type Documents = {
  _additional: Additional;
  text: string;
  file: string;
  chunkIndex: number;
  chunkTotal: number;
  totalTokens: number;
};

export type Additional = {
  distance: number;
};

export const weaviateClient: WeaviateClient = weaviate.client({
  scheme: process.env.WEAVIATE_DB_SCHEME,
  host: process.env.WEAVIATE_DB_HOST ?? '', // localhost:8080
});
