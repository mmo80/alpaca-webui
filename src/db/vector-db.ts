import weaviate, { WeaviateClient } from 'weaviate-ts-client';

export const VectorDatabaseClassName = 'Documents';

export type Documents = {
  _additional: Additional;
  text: string;
  file: string;
  chunkIndex: number;
  chunkTotal: number;
};

export type Additional = {
  distance: number;
};

export const weaviateClient: WeaviateClient = weaviate.client({
  scheme: 'http',
  host: 'localhost:8080',
});

