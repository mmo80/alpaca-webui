import { z } from 'zod';

export const FILEUPLOAD_DEFAULT_MAX_FILE_SIZE_MB = 100;
export const FILEUPLOAD_DEFAULT_ALLOWED_FILE_TYPES: string[] = [
  'application/pdf',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;
export const FILEUPLOAD_DEFAULT_FILETYPE_ERROR_MESSAGE = 'File must be a document (pdf, txt, docx)';

const createFileValidator = (
  maxFileSizeMb = FILEUPLOAD_DEFAULT_MAX_FILE_SIZE_MB,
  allowedFileTypes = FILEUPLOAD_DEFAULT_ALLOWED_FILE_TYPES,
  fileTypeErrorMessage = FILEUPLOAD_DEFAULT_FILETYPE_ERROR_MESSAGE
) => {
  return z
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
          message: fileTypeErrorMessage,
        });
      }
    })
    .pipe(z.custom<File>());
};

export const createFilesUploadFormSchema = (
  maxFileSizeMb = FILEUPLOAD_DEFAULT_MAX_FILE_SIZE_MB,
  allowedFileTypes = FILEUPLOAD_DEFAULT_ALLOWED_FILE_TYPES,
  fileTypeErrorMessage = FILEUPLOAD_DEFAULT_FILETYPE_ERROR_MESSAGE
) => {
  const fileValidator = createFileValidator(maxFileSizeMb, allowedFileTypes, fileTypeErrorMessage);

  return z.object({
    files: z.array(fileValidator).nonempty({
      message: 'At least one file must be uploaded',
    }),
  });
};

const filesUploadFormSchema = createFilesUploadFormSchema();
export type TFilesUploadForm = z.infer<typeof filesUploadFormSchema>;

export type FileInfo = {
  id: string;
  filename: string;
  sizeInBytes: number;
  type: string;
  dataUrl?: string;
};
