import { NextResponse } from 'next/server';
import { db } from '@/db/db';
import { files } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { DocumentEmbedding } from './_components/document-embedding';
import { TApiSettingsSchema, TEmbedDocumentResponse } from '@/lib/types';

export async function POST(request: Request): Promise<NextResponse<TEmbedDocumentResponse>> {
  const body = await request.json();
  const documentId = body.documentId;

  const result = await db.select({ filename: files.filename }).from(files).where(eq(files.id, documentId));
  if (result.length > 0) {
    try {
      const filename = result[0].filename;
      const embedModel = body.embedModel;
      const apiSetting = body.apiSetting as TApiSettingsSchema;

      const documentEmbedding = new DocumentEmbedding(filename);
      const response = await documentEmbedding.EmbedAndPersistDocument(embedModel, apiSetting);

      if (response.success) {
        const wResult = await db
          .update(files)
          .set({
            isEmbedded: true,
            embedModel: embedModel,
            embedApiServiceName: apiSetting.serviceId,
            noOfChunks: response.noOfChunks,
            textCharacterCount: response.textCharacterCount,
          })
          .where(eq(files.id, documentId));

        if (wResult.changes <= 0) {
          return NextResponse.json({ success: false, errorMessage: 'Failed to update database.' });
        }

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
