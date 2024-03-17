'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import throttle from 'lodash.throttle';
import { Toaster } from '@/components/ui/toaster';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UploadIcon } from '@radix-ui/react-icons';

const maxFileSizeMb = 20;

export const formSchema = z.object({
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

const files = [
  {
    filename: 'test.pdf',
    size: '10MB',
    date: '2024-03-01',
  },
  {
    filename: 'document.pdf',
    size: '13MB',
    date: '2024-03-02',
  },
];

export default function Page() {
  const [progress, setProgress] = useState(0);
  const [fileLoading, setFileLoading] = useState<boolean>(false);
  const [filename, setFilename] = useState<string>('');

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

    const requestOptions: RequestInit = {
      method: 'POST',
      body: formData,
    };

    try {
      const response = await fetch('/api/documents', requestOptions);
      if (!response.ok) throw new Error('Failed to upload');
      const data = await response.body;

      const fileSize = formFileData.file.size;
      console.log('fileSize:', fileSize);

      const reader = data?.getReader();
      if (reader == null) return;

      let receivedLength = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        receivedLength += value.length;
        const step = parseFloat((receivedLength / fileSize).toFixed(2)) * 100;
        updateProgress(step);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      toast({
        title: `File uploaded successfully!`,
      });
      setTimeout(() => {
        setFileLoading(false);
        setFilename('');
      }, 3000);
    }
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const fileRef = form.register('file');

  return (
    <section className="ps-4">
      {fileLoading && (
        <div className="flex w-[60%] items-center space-x-4 rounded-md border p-4">
          <div className="flex-1 space-y-1">
            <p className="mb-2 text-sm font-medium leading-none">{filename}</p>
            <div className="text-sm text-muted-foreground">
              <Progress value={progress} className="w-full" />
              <p className="mt-1">{progress?.toFixed()}% Complete</p>
            </div>
          </div>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
          <FormField
            control={form.control}
            name="file"
            render={() => {
              return (
                <FormItem>
                  <FormLabel>Upload Document</FormLabel>
                  <FormControl>
                    <label className="block">
                      <span className="sr-only">Choose document</span>
                      <input
                        type="file"
                        className="block w-full text-sm text-white file:mr-4 file:rounded file:border-0 file:px-5 file:py-1 file:text-sm file:font-semibold"
                        {...fileRef}
                      />
                    </label>
                  </FormControl>
                  <FormDescription>Pdf or Text document only. Max size {maxFileSizeMb}MB</FormDescription>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          <Button type="submit" className="mt-3 px-6">
            <UploadIcon className="mr-2" />
            <span className="pe-3">Upload</span>
          </Button>
        </form>
      </Form>

      <Table className="w-[60%] mt-4">
        <TableCaption>A list uploaded documents.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Filename</TableHead>
            <TableHead className="text-right">Size</TableHead>
            <TableHead>Upload Date</TableHead>
            <TableHead className="text-right">-</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.map((file) => (
            <TableRow key={file.filename}>
              <TableCell className="font-medium">{file.filename}</TableCell>
              <TableCell className="text-right">{file.size}</TableCell>
              <TableCell>{file.date}</TableCell>
              <TableCell className="text-right">-</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Toaster />
    </section>
  );
}
