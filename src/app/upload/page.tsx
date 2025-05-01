'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { toast } from 'sonner';
import { delayHighlighter } from '@/lib/utils';
import { useChatStream } from '@/hooks/use-chat-stream';
import { ChatInput } from '@/components/chat-input';
import { Chat } from '@/components/chat';
import { SystemPromptVariable, useSettingsStore } from '@/lib/settings-store';
import { ChatRole, defaultProvider, type TCustomMessage } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { useModelList } from '@/hooks/use-model-list';
import ModelAlts from '@/components/model-alts';
import { AlertBox } from '@/components/alert-box';
import { buttonVariants } from '@/components/ui/button';
import { DocumentsForm, type SelectedDocument } from './_components/documents-form';
import { useModelStore } from '@/lib/model-store';
import { ApiService } from '@/lib/api-service';
import { ProviderFactory } from '@/lib/providers/provider-factory';
import { type Provider } from '@/lib/providers/provider';
import type { FileInfo } from './upload-types';
import { getDocumentChunks } from '@/trpc/queries';

export default function Page() {
  const { selectedModel, setModel, selectedEmbedModel, selectedService, setService, selectedEmbedService } = useModelStore();
  const { systemPromptForRag, systemPromptForRagSlim, hasHydrated } = useSettingsStore();
  const { modelList } = useModelList();
  const [selectedDocument, setSelectedDocument] = useState<SelectedDocument | null>(null);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [attachments, setAttachments] = useState<FileInfo[]>([]);

  const apiService = useMemo(() => new ApiService(), []);
  const providerFactory = useMemo(() => new ProviderFactory(apiService), [apiService]);

  // ---- Chats ----
  const [isFetchLoading, setIsFetchLoading] = useState<boolean>(false);
  const mainDiv = useRef<HTMLDivElement>(null);
  const [textareaPlaceholder, setTextareaPlaceholder] = useState<string>('Choose document to interact with...');
  const { chats, setChats, handleStream, isStreamProcessing } = useChatStream();
  const [provider, setProvider] = useState<Provider | undefined>(undefined);

  useEffect(() => {
    if (selectedDocument != null && selectedModel != null) {
      setTextareaPlaceholder(`Ask a question to start conversation with ${selectedDocument?.filename}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModel]);

  const onSendChat = async (chatInput: string) => {
    if (selectedService == null || selectedEmbedService == null) {
      return;
    }
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

    const provider = { provider: selectedService.serviceId, model: selectedModel };
    const chatMessage = {
      content: chatInput,
      role: ChatRole.USER,
      provider: provider,
      streamComplete: true,
      isReasoning: false,
    } as TCustomMessage;
    setChats((prevArray) => [...prevArray, chatMessage]);

    const documents = await getDocumentChunks({
      question: chatInput,
      documentId: selectedDocument.documentId,
      embedModel: selectedEmbedModel,
      apiSetting: selectedEmbedService,
    });

    const context = documents.map((doc) => doc.text).join(' ');
    const systemPrompt = systemPromptForRagSlim
      .replace(SystemPromptVariable.userQuestion, chatInput)
      .replace(SystemPromptVariable.documentContent, context);

    const systemPromptMessage = {
      content: systemPrompt,
      role: ChatRole.SYSTEM,
      provider: defaultProvider,
      streamComplete: true,
      isReasoning: false,
    } as TCustomMessage;

    // console.debug(`systemPrompt: `, systemPrompt);

    setChats((prevArray) => [...prevArray, systemPromptMessage]);

    const providerInstance = providerFactory.getInstance(selectedService);
    if (providerInstance) {
      setProvider(providerInstance);
      const response = await providerInstance.chatCompletions(
        selectedModel,
        [...chats, systemPromptMessage, chatMessage],
        selectedService.url,
        selectedService.apiKey
      );

      setIsFetchLoading(false);
      await handleStream(response.stream, provider, providerInstance.convertResponse);
      delayHighlighter();
    }
    setIsFetchLoading(false);
  };

  const onInitDocumentConversation = (document: SelectedDocument | null) => {
    setSelectedDocument(document);
    setOpenDrawer(false);

    if (selectedModel == null || selectedModel.length < 1) {
      setTextareaPlaceholder(`Choose a model to converce with...`);
    } else {
      setTextareaPlaceholder(`Ask a question to start conversation with ${document?.filename}`);
    }
  };

  const onResetChat = () => {
    setChats([]);
  };

  return (
    <main className="flex h-full flex-col lg:flex-row">
      <section className="hidden basis-2/5 overflow-y-scroll px-3 sm:block">
        <DocumentsForm
          setChats={setChats}
          hasHydrated={hasHydrated}
          systemPromptForRag={systemPromptForRag}
          onInitDocumentConversation={onInitDocumentConversation}
        />
      </section>
      {/* h-[calc(100vh-3.5rem)] */}
      <section className="h-messages flex flex-col overflow-hidden border-0 border-stone-800 sm:h-screen sm:basis-3/5 lg:border-l-2">
        <div className="block p-3 sm:hidden">
          <Drawer open={openDrawer} onOpenChange={setOpenDrawer}>
            <DrawerTrigger className={`${buttonVariants()} w-full`}>Documents</DrawerTrigger>
            <DrawerContent className="px-3">
              <DrawerHeader>
                <DrawerTitle></DrawerTitle>
                <DrawerDescription></DrawerDescription>
              </DrawerHeader>
              <DocumentsForm
                setChats={setChats}
                hasHydrated={hasHydrated}
                systemPromptForRag={systemPromptForRag}
                onInitDocumentConversation={onInitDocumentConversation}
              />
              <DrawerFooter>
                <DrawerClose className={`${buttonVariants()}`}>Close</DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>

        <div className="flex-1 space-y-3 overflow-y-scroll px-3" ref={mainDiv}>
          {modelList.modelsIsError && <AlertBox title="Error" description={modelList.modelsError?.message ?? ''} />}
          {selectedDocument != null ? (
            <div className="p-3">
              <div className="flex flex-col items-baseline gap-1 pb-3">
                <span>Model for conversation: </span>
                <ModelAlts
                  embeddingModels={false}
                  selectedService={selectedService}
                  selectedModel={selectedModel}
                  models={modelList.models || []}
                  modelsIsSuccess={modelList.modelsIsSuccess}
                  modelsIsLoading={modelList.modelsIsLoading}
                  hasHydrated={hasHydrated}
                  onModelChange={(model) => {
                    setModel(model);
                  }}
                  onServiceChange={(service) => {
                    setService(service);
                    setModel(null);
                  }}
                  onReset={() => {
                    setService(null);
                    setModel(null);
                  }}
                />
              </div>
              Interacting with <Badge>{selectedDocument?.filename}</Badge>
            </div>
          ) : (
            <div className="p-3">
              Upload and embed documents to start, or initiate conversations with those you&apos;ve already uploaded.
            </div>
          )}

          <Chat isFetchLoading={isFetchLoading} chats={chats} mainDiv={mainDiv} />
        </div>
        <div className="sticky bottom-0 py-3">
          <ChatInput
            onSendInput={onSendChat}
            onCancelStream={provider?.cancelChatCompletionStream ?? (() => {})}
            onReset={onResetChat}
            files={attachments}
            setFiles={setAttachments}
            chatInputPlaceholder={textareaPlaceholder}
            isStreamProcessing={isStreamProcessing}
            isFetchLoading={isFetchLoading}
            isLlmModelActive={selectedModel != null && selectedEmbedModel != null && selectedDocument != null}
          />
        </div>
      </section>
    </main>
  );
}
