// 'use server';

// import { db } from '@/db/db';
// import { files } from '@/db/schema';
// import { eq } from 'drizzle-orm';
// import { DocumentEmbedding } from './common/document-embedding';

// export type EmbeddDocumentResponse = {
//   success: boolean;
//   errorMessage: string;
// };

// export type EmbeddDocumentRequest = {
//   documentId: number;
//   embedModel: string;
// };

// export const embedDocument = async (request: EmbeddDocumentRequest): Promise<EmbeddDocumentResponse> => {
//   const result = await db.select({ filename: files.filename }).from(files).where(eq(files.id, request.documentId));
//   if (result.length > 0) {
//     const filename = result[0].filename;
//     try {
//       const documentEmbedding = new DocumentEmbedding(filename);
//       const response = await documentEmbedding.EmbedAndPersistDocument();

//       if (response.success) {
//         await db.update(files).set({ isEmbedded: true, embedModel: request.embedModel }).where(eq(files.id, request.documentId));

//         return {
//           success: response.success,
//           errorMessage: '',
//         };
//       }

//       return {
//         success: response.success,
//         errorMessage: 'Something went wrong while embedding document.',
//       };
//     } catch (error) {
//       let msg = '';
//       if (error instanceof Error) {
//         msg = error.message;
//       }
//       return {
//         success: false,
//         errorMessage: 'Failed to embed document. ' + msg,
//       };
//     }
//   } else {
//     return {
//       success: false,
//       errorMessage: 'Document not found.',
//     };
//   }
// };
