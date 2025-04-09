import { z } from 'zod';

const maxFileSizeMb = 50;

const allowedFileTypes: string[] = [
  'application/pdf',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  //'application/msword',
] as const;

export const formSchema = z.object({
  file: z
    .custom<File>()
    .transform((val) => {
      if (val instanceof File) return val;
      return null;
    })
    .superRefine((file, ctx) => {
      if (!(file instanceof File)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          fatal: true,
          message: 'Not a file',
        });

        return z.NEVER;
      }

      if (file.size > maxFileSizeMb * 1024 * 1024) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Max file size allowed is ${maxFileSizeMb}MB`,
        });
      }

      if (!allowedFileTypes.includes(file.type)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'File must be an document (pdf, txt, docx)',
        });
      }
    })
    .pipe(z.custom<File>()),
});
export type TFormSchema = z.infer<typeof formSchema>;

export const UploadResponseTestSchema = z.object({
  index: z.number(),
  filename: z.string(),
  done: z.boolean(),
});
export type TUploadTestResponse = z.infer<typeof UploadResponseTestSchema>;

export const UploadResponseSchema = z.object({
  filename: z.string(),
  complete: z.boolean(),
  progress: z.number(),
});
export type TUploadResponse = z.infer<typeof UploadResponseSchema>;
