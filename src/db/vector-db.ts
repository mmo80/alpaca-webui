import { env } from '@/env';
import weaviate, { type WeaviateClient } from 'weaviate-ts-client';

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
  scheme: env.WEAVIATE_DB_SCHEME,
  host: env.WEAVIATE_DB_HOST ?? '', // localhost:8080
});
