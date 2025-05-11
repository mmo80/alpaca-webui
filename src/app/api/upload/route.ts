import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { db } from '@/db/db';
import { files } from '@/db/schema';
import { v7 as uuidv7 } from 'uuid';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file');

  if (!file || !(file instanceof File)) {
    return new NextResponse('No file uploaded', { status: 400 });
  }

  const fileBuffer = await file.arrayBuffer();
  const filePath = `./uploads/${file.name}`;

  const uint8Array = new Uint8Array(fileBuffer);

  await fs.writeFile(filePath, uint8Array);

  await db.insert(files).values({ filename: file.name, fileSize: file.size, id: uuidv7() });

  const readableStream = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(fileBuffer));
      controller.close();
    },
  });

  return new Response(readableStream);
}
