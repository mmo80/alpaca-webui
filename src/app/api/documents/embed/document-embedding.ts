import fs from 'fs';
import { chunkTextBySentences } from 'matts-llm-tools';
import { Ollama } from 'ollama';
import { DocumentReader } from './document-reader';
import { VectorDatabaseClassName, weaviateClient } from '@/db/vector-db';

export type DocumentEmbeddingRespopnse = {
  success: boolean;
  errorMessage: string;
  embedModel: string;
};

export type DocumentVectorSchema = {
  text: string;
  file: string;
  chunkIndex: number;
  chunkTotal: number;
  embed: number[];
};

export class DocumentEmbedding {
  private filePath: string;
  private filename: string;
  private basePath = './uploads/';
  private ollama: Ollama;

  constructor(filename: string) {
    if (!filename) {
      throw new Error('Filename is required.');
    }
    const filePath = `${this.basePath}${filename}`;

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    this.filename = filename;
    this.filePath = filePath;

    this.ollama = new Ollama({ host: 'http://localhost:11434' });
  }

  private async batchVectorsToDatabase(list: DocumentVectorSchema[]): Promise<boolean> {
    try {
      let batcher = weaviateClient.batch.objectsBatcher();
      let counter = 0;
      const batchSize = 100;

      for (const data of list) {
        batcher = batcher.withObject({
          class: VectorDatabaseClassName,
          properties: {
            text: data.text, 
            file: data.file,
            chunkIndex: data.chunkIndex,
            chunkTotal: data.chunkTotal
          },
          vector: data.embed,
        });

        if (counter++ == batchSize) {
          await batcher.do();

          counter = 0;
          batcher = weaviateClient.batch.objectsBatcher();
        }
      }

      await batcher.do();
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      } else {
        console.error('Failed to batch vectors to database.');
      }
      return false;
    }

    return true;
  }

  private async getOllamaEmbeddings(chunks: string[], filename: string, model: string): Promise<DocumentVectorSchema[]> {
    const documentVectors: DocumentVectorSchema[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const result = await this.ollama.embeddings({ model: model, prompt: chunk });
      const embed = result.embedding;

      const chunkjson = { text: chunk, file: filename, embed: embed, chunkIndex: i, chunkTotal: chunks.length };
      documentVectors.push(chunkjson);
    }

    return documentVectors;
  }

  private getFileContent = async (): Promise<string> => {
    const reader = new DocumentReader(this.filePath);
    return await reader.getFileContent();
  };

  async EmbedAndPersistDocument(embedModel: string): Promise<DocumentEmbeddingRespopnse> {
    const fileContent = await this.getFileContent();
    const documentChunks = chunkTextBySentences(fileContent, 8, 0);
    const documentVectors = await this.getOllamaEmbeddings(documentChunks, this.filename, embedModel);
    const success = await this.batchVectorsToDatabase(documentVectors);
    return { success: success, errorMessage: '', embedModel: embedModel };
  }
}
