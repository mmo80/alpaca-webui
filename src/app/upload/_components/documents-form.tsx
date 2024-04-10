import { useTransition, useEffect, useState, useRef, FC, SetStateAction, Dispatch } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import throttle from 'lodash.throttle';
import { Progress } from '@/components/ui/progress';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { DropZone } from '@/components/drop-zone';
import { getFiles } from '@/actions/get-files';
import { TFile } from '@/db/schema';
import { ChatRole, TChatMessage } from '@/lib/types';
import FileTable from './file-table';
import { useModelList } from '@/hooks/use-model-list';
import ModelAlts from '@/components/model-alts';
import { AlertBox } from '@/components/alert-box';
import { z } from 'zod';
import { toast } from 'sonner';
import { HttpMethod, api } from '@/lib/api';
import { formatBytes } from '@/lib/utils';
import { useModelStore } from '@/lib/model-store';
import { useSettingsStore } from '@/lib/settings-store';

const maxFileSizeMb = 50;
const allowedFileTypes: string[] = [
  'application/pdf',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
] as const;
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

      if (!allowedFileTypes.includes(file.type)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'File must be an document (pdf, txt, docx, doc)',
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
  setChats: Dispatch<SetStateAction<TChatMessage[]>>;
  hasHydrated: boolean;
  systemPromptForRag: string;
  // eslint-disable-next-line no-unused-vars
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
  const [files, setFiles] = useState<TFile[]>([]);
  const [fileLoading, setFileLoading] = useState<boolean>(false);
  const [filesLoading, setFilesLoading] = useState<boolean>(true);
  const [filename, setFilename] = useState<string>('');
  const [filesize, setFilesize] = useState<number>(0);
  const [, startTransition] = useTransition();
  const [fadeOut, setFadeOut] = useState<boolean>(false);
  const [isEmbedding, setIsEmbedding] = useState<boolean>(false);
  const { modelList: embeddedModelList } = useModelList(true);
  const form = useForm<TFormSchema>({ resolver: zodResolver(formSchema) });
  const { ref: fileRef, ...fileRest } = form.register('file');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadFiles().catch(console.error);
  }, [fileLoading]);

  const loadFiles = async () => {
    setFilesLoading(true);
    startTransition(async () => {
      const fileList = await getFiles();
      setFiles(fileList);
      setFilesLoading(false);
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
      onFileSelected(file);
    }
  };

  const onEmbedDocument = async (documentId: number) => {
    if (selectedEmbedModel == null || selectedEmbedService == null) {
      toast.warning('No embedding model or service choosen');
      return;
    }

    setIsEmbedding(true);
    const response = await api.embedDocument(
      documentId,
      selectedEmbedModel,
      selectedEmbedService.url,
      selectedEmbedService.apiKey
    );

    if (response.success) {
      toast.success('Document embedded successfully');
    } else {
      toast.error('Failed to embed document', {
        description: response.errorMessage,
      });
    }
    await loadFiles();
    setIsEmbedding(false);
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
      toast.warning(`Settings for Service not found! ${embeddingServiceId}`);
      return;
    }

    onInitDocumentConversation({
      documentId: documentId,
      filename: filename,
    });
    setChats([]);
    setEmbedModel(embeddingModel);
    setEmbedService(embedService);

    /*
    const msg1 = {
      content: `Elon Musk is a business magnate, industrial designer, and engineer from South Africa, currently residing in the United States.
He is the founder, CEO, CTO, and chief designer of SpaceX; co-founder, CEO, and product architect of Tesla, Inc.; and CEO of Neuralink and The Boring Company.
Musk's companies have disrupted industries such as electric cars, solar energy, and space travel.
He is known for his ambitious goals and his unconventional approach to business.
Musk was born in Pretoria, South Africa, and moved to Canada when he was 17 to attend Queen's University.
He then moved to the United States to attend the University of Pennsylvania, where he earned degrees in physics and economics.
Musk's first company, Zip2, was sold to Compaq for $307 million in 1999.
He then founded X.com, an online payment company, which later became PayPal.
Musk's net worth is estimated to be over $200 billion, making him one of the richest people in the world.
Musk is also known for his involvement in various philanthropic efforts, including donating to charities and funding research in artificial intelligence and renewable energy.`,
      role: ChatRole.ASSISTANT,
    };
    const msg2 = {
      content: `Jensen Huang is the Taiwanese-American businessman and engineer who has served as the CEO of Nvidia Corporation since January 1993.
He joined Nvidia in 1993 as the vice president of sales and marketing, and became CEO just a year later.
Huang is a pioneer in the field of graphics processing units (GPUs) and has led Nvidia to become a leading company in this technology.
He is known for his visionary leadership and his ability to anticipate market trends and consumer needs.
Huang earned a Bachelor's degree in electrical engineering from Oregon State University and a Master's degree in electrical engineering from Stanford University.
He began his career at LSI Logic, where he worked on graphics and multimedia products.
Huang has been recognized for his contributions to the technology industry with numerous awards, including the National Medal of Technology and Innovation. a member of the National Academy of Engineering and the American Academy of Arts and Sciences.
Huang is also an active investor and advisor to various technology startups.
He is known for his passion for technology and his commitment to pushing the boundaries of what is possible with GPUs.
Note: The information provided is accurate as of my knowledge up to 2021.`,
      role: ChatRole.ASSISTANT,
    };
    
    setChats((prevArray) => [...prevArray, msg1]);
    setChats((prevArray) => [...prevArray, msg2]);
    */

    const ragSystemMessage = { content: systemPromptForRag || '', role: ChatRole.SYSTEM };
    setChats((prevArray) => [...prevArray, ragSystemMessage]);
  };

  const reload = async () => {
    await loadFiles();
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
          className={`${fadeOut ? 'opacity-0' : 'opacity-100'} flex items-center space-x-4 rounded-md border p-4 transition-opacity duration-1000 ease-in-out`}
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

      {embeddedModelList.modelsIsError && (
        <AlertBox title="Error" description={embeddedModelList.modelsError?.message ?? ''} />
      )}
      <div className="flex flex-col items-baseline gap-1">
        <span>Model for embedding:</span>
        <ModelAlts
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
        filesLoading={filesLoading}
        isEmbedding={isEmbedding}
        onEmbedDocument={onEmbedDocument}
        initConversationWithDocument={initConversationWithDocument}
        reload={reload}
      />
    </>
  );
};
