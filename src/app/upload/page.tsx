'use client';

import { useTransition, useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import throttle from 'lodash.throttle';
import { Progress } from '@/components/ui/progress';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { TFile } from '@/db/schema';
import { delayHighlighter, formatBytes } from '@/lib/utils';
import { DropZone } from '@/components/drop-zone';
import { getFiles } from '@/actions/get-files';
import { api } from '@/lib/api';
import { useChatStream } from '@/hooks/use-chat-stream';
import { ChatInput } from '@/components/chat-input';
import { Chat } from '@/components/chat';
import { RagSystemPromptVariable, useModelStore, useSettingsStore } from '@/lib/store';
import { GetChunksRequest, getFilteredChunks } from '@/actions/get-filtered-chunks';
import { ChatRole } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import FileTable from './_components/file-table';
import { getApiService } from '@/lib/data';
import { useModelList } from '@/hooks/use-model-list';
import ModelAlts from '@/components/model-alts';
import { AlertBox } from '@/components/alert-box';

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

type SelectedDocument = {
  documentId: number;
  filename: string;
};

export default function Page() {
  const { selectedModel, setModel, selectedEmbedModel, setEmbedModel } = useModelStore();
  const { systemPromptForRag, systemPromptForRagSlim, hasHydrated } = useSettingsStore();
  const [progress, setProgress] = useState(0);
  const [files, setFiles] = useState<TFile[]>([]);
  const [fileLoading, setFileLoading] = useState<boolean>(false);
  const [filesLoading, setFilesLoading] = useState<boolean>(true);
  const [filename, setFilename] = useState<string>('');
  const [filesize, setFilesize] = useState<number>(0);
  const [, startTransition] = useTransition();
  const [fadeOut, setFadeOut] = useState<boolean>(false);
  const [isEmbedding, setIsEmbedding] = useState<boolean>(false);
  const [selectedDocument, setSelectedDocument] = useState<SelectedDocument | null>(null);

  // Chats : START
  const [isFetchLoading, setIsFetchLoading] = useState<boolean>(false);
  const mainDiv = useRef<HTMLDivElement>(null);
  const textareaPlaceholder = useRef<string>('Choose document to interact with...');
  const { chats, setChats, handleStream, isStreamProcessing } = useChatStream();
  // Chats : END

  const { modelList } = useModelList();
  const { modelList: embeddedModelList } = useModelList(true);

  const form = useForm<TFormSchema>({
    resolver: zodResolver(formSchema),
  });

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
    if (selectedEmbedModel == null) {
      toast.warning('No embedding model choosen');
      return;
    }

    setIsEmbedding(true);
    const response = await api.embedDocument(
      documentId,
      selectedEmbedModel,
      embeddedModelList.baseUrl,
      embeddedModelList.token
    );

    if (response.success) {
      toast.success('Document embedded successfully');
    } else {
      toast.error('Failed to embed document', {
        description: response.errorMessage,
      });
    }
    await loadFiles(); //.catch(console.error);
    setIsEmbedding(false);
  };

  const onSendChat = async (chatInput: string) => {
    if (chatInput === '') {
      toast.warning('Ask a question first');
      return;
    }
    if (systemPromptForRagSlim == null) {
      toast.warning('No slim version of the RAG system prompt set!');
      return;
    }
    if (selectedEmbedModel == null) {
      toast.warning('No embed model choosen');
      return;
    }
    if (selectedModel == null) {
      toast.warning('No conversation model choosen');
      return;
    }
    if (selectedDocument == null) {
      toast.warning('No document selected');
      return;
    }

    setIsFetchLoading(true);

    const chatMessage = { content: chatInput, role: ChatRole.USER };
    setChats((prevArray) => [...prevArray, chatMessage]);

    const request: GetChunksRequest = {
      question: chatInput,
      documentId: selectedDocument.documentId,
      embedModel: selectedEmbedModel,
      baseUrl: modelList.baseUrl,
      apiKey: modelList.token,
    };

    const documents = await getFilteredChunks(request);
    const context = documents.map((d) => d.text).join(' ');
    console.log(`context: `, context);
    const systemPrompt = systemPromptForRagSlim
      .replace(RagSystemPromptVariable.userQuestion, chatInput)
      .replace(RagSystemPromptVariable.documentContent, context);
    const systemPromptMessage = { content: systemPrompt, role: ChatRole.SYSTEM };
    console.log(`systemPrompt: `, systemPrompt);
    setChats((prevArray) => [...prevArray, systemPromptMessage]);

    const streamReader = await api.getChatStream(
      selectedModel,
      [...chats, systemPromptMessage, chatMessage],
      modelList.baseUrl,
      modelList.token
    );
    setIsFetchLoading(false);
    await handleStream(streamReader);
    delayHighlighter();
  };

  const initConversationWithDocument = async (documentId: number, filename: string, embeddingModel: string) => {
    if (systemPromptForRag == null || systemPromptForRag === '') {
      toast.warning('RAG System Prompt not set!');
      return;
    }

    setSelectedDocument({
      documentId: documentId,
      filename: filename,
    });
    setEmbedModel(embeddingModel);

    textareaPlaceholder.current = `Ask a question to start conversation with ${filename}`;

    const ragSystemMessage = { content: systemPromptForRag || '', role: ChatRole.SYSTEM };
    setChats((prevArray) => [...prevArray, ragSystemMessage]);
  };

  return (
    <>
      <main className="flex h-full">
        <section className="basis-2/5 pe-3">
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
          <div className="flex items-baseline gap-2">
            {selectedEmbedModel == null ? (
              <>
                Model for embedding:
                <ModelAlts
                  modelName={selectedEmbedModel}
                  models={embeddedModelList.models || []}
                  modelsIsSuccess={embeddedModelList.modelsIsSuccess}
                  modelsIsLoading={embeddedModelList.modelsIsLoading}
                  hasHydrated={hasHydrated}
                  onModelChange={(modelName: string) => {
                    setEmbedModel(modelName);
                  }}
                />
              </>
            ) : (
              <span className="text-xs">
                Embedd with: {getApiService(embeddedModelList.baseUrl)?.label}, <strong>{selectedEmbedModel}</strong>
              </span>
            )}
          </div>

          <FileTable
            files={files}
            filesLoading={filesLoading}
            isEmbedding={isEmbedding}
            onEmbedDocument={onEmbedDocument}
            initConversationWithDocument={initConversationWithDocument}
          />
        </section>
        <section className="h-screen basis-3/5 border-l-2 border-stone-800 ps-3">
          <div className="flex-1 space-y-3 overflow-y-auto" ref={mainDiv}>
            {modelList.modelsIsError && <AlertBox title="Error" description={modelList.modelsError?.message ?? ''} />}
            {selectedDocument != null ? (
              <div className="p-3">
                <div className="flex items-baseline gap-2 pb-3">
                  <span>Model for conversation: </span>
                  <ModelAlts
                    modelName={selectedModel}
                    models={modelList.models || []}
                    modelsIsSuccess={modelList.modelsIsSuccess}
                    modelsIsLoading={modelList.modelsIsLoading}
                    hasHydrated={hasHydrated}
                    onModelChange={(modelName: string) => {
                      setModel(modelName);
                    }}
                  />
                </div>
                Interacting with <Badge>{selectedDocument?.filename}</Badge>
              </div>
            ) : (
              <div className="p-3">Upload your documents and start asking questions to initiate the conversation.</div>
            )}

            <Chat isFetchLoading={isFetchLoading} chats={chats} mainDiv={mainDiv} />
          </div>
          <div className="sticky top-[100vh] py-3">
            <ChatInput
              onSendInput={onSendChat}
              onCancelStream={api.cancelChatStream}
              chatInputPlaceholder={textareaPlaceholder.current}
              isStreamProcessing={isStreamProcessing}
              isFetchLoading={isFetchLoading}
              isLlmModelActive={selectedModel != null && selectedEmbedModel != null}
            />
          </div>
        </section>
      </main>
      {/* <main className="flex-1 space-y-3 overflow-y-auto" ref={mainDiv}>
        <section>
          {selectedDocument != null && (
            <div className="p-3">
              Convercing with <Badge>{selectedDocument?.filename}</Badge>
            </div>
          )}

          <Chat isFetchLoading={isFetchLoading} chats={chats} mainDiv={mainDiv} />
        </section>
      </main> */}
    </>
  );
}
