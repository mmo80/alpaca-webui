import { NextResponse } from 'next/server';
import { db } from '@/db/db';
import { files } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { DocumentEmbedding } from './_components/document-embedding';
import { TEmbedDocumentResponse } from '@/lib/types';
import { getApiService } from '@/lib/data';

export async function POST(request: Request): Promise<NextResponse<TEmbedDocumentResponse>> {
  const body = await request.json();
  const documentId = body.documentId;

  const result = await db.select({ filename: files.filename }).from(files).where(eq(files.id, documentId));
  if (result.length > 0) {
    try {
      const filename = result[0].filename;
      const embedModel = body.embedModel;
      const url = body.baseUrl;
      const apiKey = body.apiKey;

      const documentEmbedding = new DocumentEmbedding(filename);
      const response = await documentEmbedding.EmbedAndPersistDocument(embedModel, url, apiKey);

      if (response.success) {
        const apiService = getApiService(url);

        await db
          .update(files)
          .set({
            isEmbedded: true,
            embedModel: embedModel,
            embedApiServiceName: apiService?.label,
            noOfChunks: response.noOfChunks,
            textCharacterCount: response.textCharacterCount,
          })
          .where(eq(files.id, documentId));
        return NextResponse.json({ success: response.success, errorMessage: null });
      }

      return NextResponse.json({
        success: response.success,
        errorMessage: 'Something went wrong while embedding document.',
      });
    } catch (error) {
      let msg = '';
      if (error instanceof Error) {
        msg = error.message;
      }
      return NextResponse.json({ success: false, errorMessage: 'Failed to embed document. ' + msg });
    }
  } else {
    return NextResponse.json({ success: false, errorMessage: 'Document not found.' });
  }
}
