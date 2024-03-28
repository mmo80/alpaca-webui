import { NextResponse } from "next/server";
import { db } from '@/db/db';
import { files } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { DocumentEmbedding } from '@/app/api/documents/embed/document-embedding';
import { EmbedDocumentResponse } from "@/lib/types";

export async function POST(request: Request): Promise<NextResponse<EmbedDocumentResponse>> {
  const body = await request.json();
  const documentId = body.documentId
  const embedModel = body.embedModel;

  const result = await db.select({ filename: files.filename }).from(files).where(eq(files.id, documentId));
  if (result.length > 0) {
    const filename = result[0].filename;
    try {
      const documentEmbedding = new DocumentEmbedding(filename);
      const response = await documentEmbedding.EmbedAndPersistDocument(embedModel);
  
      if (response.success) {
        await db.update(files).set({ isEmbedded: true, embedModel: embedModel }).where(eq(files.id, documentId));
        return NextResponse.json({ success: response.success, errorMessage: null });
      }
  
      return NextResponse.json({ success: response.success, errorMessage: 'Something went wrong while embedding document.' });
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
