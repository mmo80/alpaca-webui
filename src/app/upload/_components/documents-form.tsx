import { useState, useRef, type FC, type SetStateAction, type Dispatch } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import throttle from 'lodash.throttle';
import { Progress } from '@/components/ui/progress';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { DropZone } from '@/components/drop-zone';
import { ChatRole, defaultProvider, type TCustomMessage } from '@/lib/types';
import FileTable from './file-table';
import { useModelList } from '@/hooks/use-model-list';
import ModelAlts from '@/components/model-alts';
import { AlertBox } from '@/components/alert-box';
import { z } from 'zod';
import { toast } from 'sonner';
import { apiAction } from '@/lib/api';
import { formatBytes } from '@/lib/utils';
import { useModelStore } from '@/lib/model-store';
import { useSettingsStore } from '@/lib/settings-store';
import { HttpMethod } from '@/lib/api-service';
import { useFilesQuery } from '@/trpc/queries';

const maxFileSizeMb = 50;
const allowedFileTypes: string[] = [
  'application/pdf',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  //'application/msword',
] as const;

const formSchema = z.object({
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

type TFormSchema = z.infer<typeof formSchema>;

export type SelectedDocument = {
  documentId: number;
  filename: string;
};

type DocumentsFormProps = {
  setChats: Dispatch<SetStateAction<TCustomMessage[]>>;
  hasHydrated: boolean;
  systemPromptForRag: string;
  onInitDocumentConversation: (document: SelectedDocument | null) => void;
};

export const DocumentsForm: FC<DocumentsFormProps> = ({
  setChats,
  hasHydrated,
  systemPromptForRag,
  onInitDocumentConversation,
}) => {
  const { selectedEmbedModel, setEmbedModel, selectedEmbedService, setEmbedService } = useModelStore();
  const { services } = useSettingsStore();
  const [progress, setProgress] = useState(0);
  const [fileLoading, setFileLoading] = useState<boolean>(false);
  const [filename, setFilename] = useState<string>('');
  const [filesize, setFilesize] = useState<number>(0);
  const [fadeOut, setFadeOut] = useState<boolean>(false);
  const [isEmbedding, setIsEmbedding] = useState<boolean>(false);
  const [fileIdEmbedding, setFileIdEmbedding] = useState<number | null>(null);
  const { modelList: embeddedModelList } = useModelList(true);
  const form = useForm<TFormSchema>({ resolver: zodResolver(formSchema) });
  const { ref: fileRef, ...fileRest } = form.register('file');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { data: files, isLoading: isFilesLoading, refetch: refetchFiles } = useFilesQuery();

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

    const uploadRequestOptions: RequestInit = {
      method: HttpMethod.POST,
      body: formData,
    };

    try {
      const response = await fetch('/api/documents', uploadRequestOptions);
      if (!response.ok) toast.error('Failed to upload');
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
      toast.error('Error uploading file');
      console.error('Error uploading file:', error);
    } finally {
      toast.success(`Document uploaded successfully!`, {
        description: `File: ${formFileData.file.name}`,
      });

      await reload();

      setFadeOut(true);

      setFileLoading(false);
      setFilename('');
      setFilesize(0);
      updateProgress(0);

      // setTimeout(() => {
      //   setFileLoading(false);
      //   setFilename('');
      //   setFilesize(0);
      //   updateProgress(0);
      // }, 2000);
    }
  };

  const onFileSelected = async (file: File) => {
    form.setValue('file', file);
    const isValid = await form.trigger();
    if (isValid) {
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
      if (file) {
        onFileSelected(file);
      }
    }
  };

  const onEmbedDocument = async (documentId: number) => {
    if (selectedEmbedModel == null || selectedEmbedService == null) {
      toast.warning('No embedding model or service choosen');
      return;
    }

    setIsEmbedding(true);
    setFileIdEmbedding(documentId);
    const response = await apiAction.embedDocument(documentId, selectedEmbedModel, selectedEmbedService);

    if (response.success) {
      toast.success('Document embedded successfully');
    } else {
      toast.error('Failed to embed document', {
        description: response.errorMessage,
      });
    }

    await reload();

    setIsEmbedding(false);
    setFileIdEmbedding(null);
  };

  const initConversationWithDocument = async (
    documentId: number,
    filename: string,
    embeddingModel: string,
    embeddingServiceId: string
  ) => {
    if (systemPromptForRag == null || systemPromptForRag === '') {
      toast.warning('RAG System Prompt not set!');
      return;
    }

    const embedService = services.find((s) => s.serviceId == embeddingServiceId);
    if (embedService === undefined) {
      toast.warning(`Settings for service '${embeddingServiceId}' has been removed. Please add them under settings.`);
      return;
    }

    onInitDocumentConversation({
      documentId: documentId,
      filename: filename,
    });
    setChats([]);
    setEmbedModel(embeddingModel);
    setEmbedService(embedService);

    const ragSystemMessage = { content: systemPromptForRag || '', role: ChatRole.SYSTEM, provider: defaultProvider };
    setChats((prevArray) => [...prevArray, ragSystemMessage]);
  };

  const reload = async () => {
    const result = await refetchFiles();
    console.log('* Refetch result: ', result);
  };

  return (
    <>
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
          className={`${fadeOut ? 'opacity-0' : 'opacity-100'} flex items-center space-x-4 rounded-md border p-4 transition-opacity duration-500 ease-in-out`}
        >
          <div className="flex-1 space-y-1">
            <p className="mb-2 text-sm leading-none font-medium">{filename}</p>
            <div className="text-muted-foreground text-sm">
              <Progress value={progress} className="w-full" />
              <div className="flex justify-between">
                <p className="mt-1">{formatBytes(filesize)}</p>
                <p className="mt-1">{progress?.toFixed()}% Complete</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {embeddedModelList.modelsIsError && (
        <AlertBox title="Error" description={embeddedModelList.modelsError?.message ?? ''} />
      )}
      <div className="flex flex-col items-baseline gap-1 pb-2">
        <span>Model for embedding:</span>
        <ModelAlts
          embeddingModels={true}
          selectedService={selectedEmbedService}
          selectedModel={selectedEmbedModel}
          models={embeddedModelList.models ?? []}
          modelsIsSuccess={embeddedModelList.modelsIsSuccess}
          modelsIsLoading={embeddedModelList.modelsIsLoading}
          hasHydrated={hasHydrated}
          onModelChange={(model) => {
            setEmbedModel(model);
          }}
          onServiceChange={(service) => {
            setEmbedService(service);
            setEmbedModel(null);
          }}
          onReset={() => {
            setEmbedService(null);
            setEmbedModel(null);
          }}
        />
      </div>

      <FileTable
        files={files}
        filesLoading={isFilesLoading}
        isEmbedding={isEmbedding}
        fileIdEmbedding={fileIdEmbedding}
        onEmbedDocument={onEmbedDocument}
        initConversationWithDocument={initConversationWithDocument}
        reload={reload}
      />
    </>
  );
};
