import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { db } from '@/db/db';
import { files } from '@/db/schema';
import { VectorDatabaseClassName, weaviateClient } from '@/db/vector-db';
import { fileUploadFolder } from '@/lib/providers/data';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  const body = await request.json();

  const documentId = body.documentId;
  const dbResult = await db
    .select({ filename: files.filename, embedded: files.isEmbedded })
    .from(files)
    .where(eq(files.id, documentId));
  if (dbResult.length > 0) {
    const filename = dbResult[0]!.filename;
    const isEmbedded = dbResult[0]!.embedded;
    const deleteResult = await db.delete(files).where(eq(files.id, documentId)).returning({ id: files.id });
    if (deleteResult.length === 1 && deleteResult[0]!.id == documentId) {
      if (isEmbedded) {
        const vResult = await deleteFromVectorDatabase(filename);
        if (!vResult) {
          throw new Error(`Could not delete file ${documentId} from vector database.`);
        }
      }
      await removeFileFromDisk(filename);
    } else {
      throw new Error(`Could not delete file ${documentId} from db.`);
    }
  }

  return NextResponse.json({ success: true, errorMessage: '' });
}

const deleteFromVectorDatabase = async (filename: string): Promise<boolean> => {
  const result = await weaviateClient.batch
    .objectsBatchDeleter()
    .withClassName(VectorDatabaseClassName)
    .withWhere({
      path: ['file'],
      operator: 'Equal',
      valueText: filename,
    })
    .do();

  if (result.results?.successful ?? 0 > 0) {
    return true;
  }
  return false;
};

const removeFileFromDisk = async (filename: string): Promise<boolean> => {
  await fs.unlink(`${fileUploadFolder}${filename}`);
  return true;
};
