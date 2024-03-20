'use client';

import { useTransition, useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import throttle from 'lodash.throttle';
import { Toaster } from '@/components/ui/toaster';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/use-toast';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileTextIcon } from '@radix-ui/react-icons';
import { getFiles } from '@/actions/get-files';
import { TFileSchema } from '@/db/schema';
import { formatBytes } from '@/lib/utils';
import { DropZone } from '@/components/drop-zone';

const maxFileSizeMb = 20;

const formSchema = z.object({
  file: z
    .custom<FileList>()
    .transform((val) => {
      if (val instanceof File) return val;
      if (val instanceof FileList) return val[0];
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

      if (!['application/pdf', 'text/plain'].includes(file.type)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'File must be an document (pdf, txt)',
        });
      }
    })
    .pipe(z.custom<File>()),
});

type TFormSchema = z.infer<typeof formSchema>;

export default function Page() {
  const [progress, setProgress] = useState(0);
  const [fileLoading, setFileLoading] = useState<boolean>(false);
  const [filename, setFilename] = useState<string>('');
  const [filesize, setFilesize] = useState<number>(0);
  const [, startTransition] = useTransition();
  const [files, setFiles] = useState<TFileSchema[]>([]);
  const [fadeOut, setFadeOut] = useState<boolean>(false);

  const form = useForm<TFormSchema>({
    resolver: zodResolver(formSchema),
  });

  const { ref: fileRef, ...fileRest } = form.register('file');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadFiles().catch(console.error);
  }, [fileLoading]);

  const loadFiles = async () => {
    startTransition(async () => {
      const fileList = await getFiles();
      setFiles(fileList);
    });
  };

  const updateProgress = throttle(
    (percent: number) => {
      setProgress(percent);
    },
    100,
    { leading: true, trailing: true }
  );

  const onSubmit = async (formFileData: TFormSchema) => {
    setFileLoading(true);

    let formData = new FormData();
    formData.append('file', formFileData.file, formFileData.file.name);

    setFilename(formFileData.file.name);
    setFilesize(formFileData.file.size);

    const requestOptions: RequestInit = {
      method: 'POST',
      body: formData,
    };

    try {
      const response = await fetch('/api/documents', requestOptions);
      if (!response.ok) throw new Error('Failed to upload');
      const data = await response.body;

      const reader = data?.getReader();
      if (reader == null) return;

      let receivedLength = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        receivedLength += value.length;
        const step = parseFloat((receivedLength / formFileData.file.size).toFixed(2)) * 100;
        updateProgress(step);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      toast({
        title: `File uploaded successfully!`,
      });

      setTimeout(() => {
        setFadeOut(true);
      }, 2000);
      setTimeout(() => {
        setFileLoading(false);
        setFilename('');
        setFilesize(0);
        updateProgress(0);
      }, 3000);
    }
  };

  const onFileSelected = async (file: File) => {
    console.log('File dropped:', file.name);

    form.setValue('file', file);
    const isValid = await form.trigger();
    if (isValid) {
      console.log('File is valid');

      form.handleSubmit(onSubmit)();

      setFilename(file.name);
      setFilesize(file.size);
      setFileLoading(true);
      setFadeOut(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files) {
      const file = e.target.files[0];
      onFileSelected(file);
    }
  };

  return (
    <section className="ps-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
          <FormField
            control={form.control}
            name="file"
            render={() => {
              return (
                <FormItem>
                  <FormControl>
                    <input
                      type="file"
                      multiple={false}
                      className="hidden"
                      {...fileRest}
                      ref={(e) => {
                        fileRef(e);
                        fileInputRef.current = e;
                      }}
                      onChange={handleChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <DropZone onFileSelected={onFileSelected} fileInputRef={fileInputRef} />

        </form>
      </Form>

      {fileLoading && (
        <div
          className={`${fadeOut ? 'opacity-0' : 'opacity-100'} flex w-[60%] items-center space-x-4 rounded-md border p-4 transition-opacity duration-1000 ease-in-out`}
        >
          <div className="flex-1 space-y-1">
            <p className="mb-2 text-sm font-medium leading-none">{filename}</p>
            <div className="text-sm text-muted-foreground">
              <Progress value={progress} className="w-full" />
              <div className="flex justify-between">
                <p className="mt-1">{formatBytes(filesize)}</p>
                <p className="mt-1">{progress?.toFixed()}% Complete</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <Table className="mt-4 w-[60%]">
        <TableHeader>
          <TableRow>
            <TableHead>Document</TableHead>
            <TableHead className="text-right">Size</TableHead>
            <TableHead>Upload Date</TableHead>
            <TableHead className="text-right">-</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.map((file) => (
            <TableRow key={file.filename}>
              <TableCell className="flex items-center font-medium">
                <FileTextIcon className="me-2" />
                <span>{file.filename}</span>
              </TableCell>
              <TableCell className="text-right">{formatBytes(file.fileSize ?? 0)}</TableCell>
              <TableCell>{file.timestamp}</TableCell>
              <TableCell className="text-right">-</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Toaster />
    </section>
  );
}
