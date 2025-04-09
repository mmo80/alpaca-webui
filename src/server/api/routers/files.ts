import { createTRPCRouter, publicProcedure } from '../trpc';
import { files } from '@/db/schema';
import { type TUploadResponse, type TUploadTestResponse } from '@/app/upload/upload-types';
import { promises as fs } from 'fs';
import { z } from 'zod';

const fileUploadSchema = z.object({
  name: z.string(),
  type: z.string(),
  size: z.number(),
  data: z.string(),
});

export const filesRouter = createTRPCRouter({
  all: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.select().from(files);
  }),
  // formSchema
  upload: publicProcedure.input(fileUploadSchema).mutation(async function* ({ ctx, input }) {
    const { name, type, size, data } = input;

    // Decode base64 data
    const fileBuffer = Buffer.from(data, 'base64');
    const filePath = `./uploads/${name}`;
    await fs.mkdir('./uploads', { recursive: true });

    // Get the total file size for progress calculation
    const totalFileSize = fileBuffer.length;

    // Split into chunks for progress reporting
    const updateFrequency = Math.max(1, Math.floor(totalFileSize * 0.01)); // 1% chunks
    let processedBytes = 0;
    let progressPercent = 0;

    // Open a file descriptor for writing
    const fileHandle = await fs.open(filePath, 'w');

    try {
      // Initial progress update
      yield {
        filename: name,
        complete: false,
        progress: 0,
      } as TUploadResponse;

      // Process the buffer in chunks to report progress
      while (processedBytes < totalFileSize) {
        const chunkSize = Math.min(updateFrequency, totalFileSize - processedBytes);
        const chunk = fileBuffer.subarray(processedBytes, processedBytes + chunkSize);

        // Write the current chunk
        await fileHandle.write(chunk, 0, chunk.length, processedBytes);

        // Update processed bytes count
        processedBytes += chunkSize;

        // Calculate progress percentage
        progressPercent = Math.round((processedBytes / totalFileSize) * 100);

        // Yield progress update
        yield {
          filename: name,
          complete: false, // processedBytes >= totalFileSize,
          progress: progressPercent,
        } as TUploadResponse;
      }

      // Add entry to database after file is written
      await ctx.db.insert(files).values({ filename: name, fileSize: size });

      console.log(`File uploaded successfully: ${name}, size: ${size}`);

      // Final update
      yield {
        filename: name,
        complete: true,
        progress: 100,
      } as TUploadResponse;
    } finally {
      // Always close file handle
      await fileHandle.close();
    }
  }),
  iterable: publicProcedure.query(async function* () {
    const to = 5;
    for (let i = 1; i <= 5; i++) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      yield { index: i, filename: `thefile.pdf`, done: i === to } as TUploadTestResponse;
    }
  }),
});
