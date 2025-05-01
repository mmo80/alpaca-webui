'use client';

import { type FC, useState, useRef, useEffect, useMemo } from 'react';
import { type TContentImage, type TContentText, type TCustomChatMessage, type TCustomMessage, ChatRole } from '@/lib/types';
import { AlertBox } from '@/components/alert-box';
import { cleanString, delayHighlighter, formatBytes, isValidJson, removeJunkStreamData } from '@/lib/utils';
import { ChatInput } from '@/components/chat-input';
import { Chat } from '@/components/chat';
import { useChatStream } from '@/hooks/use-chat-stream';
import { useModelList } from '@/hooks/use-model-list';
import { SystemPromptVariable, useSettingsStore } from '@/lib/settings-store';
import { useModelStore } from '@/lib/model-store';
import ModelAlts from '@/components/model-alts';
import { toast } from 'sonner';
import { ApiService, type ChatError } from '@/lib/api-service';
import { ProviderFactory } from '@/lib/providers/provider-factory';
import { type Provider } from '@/lib/providers/provider';
import { useMutation } from '@tanstack/react-query';
import { getSingleChatHistoryById } from '@/trpc/queries';
import { useRouter, useSearchParams } from 'next/navigation';
import { queryClient, useTRPC } from '@/trpc/react';
import type { FileInfo } from '../upload/upload-types';

export const Main: FC = () => {
  const newThreadTitle = 'New Thread';
  const mainDiv = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const queryChatHistoryId = searchParams.get('id');

  const { systemPrompt, hasHydrated, systemPromptForChatTitle } = useSettingsStore();
  const { modelList } = useModelList();
  const { selectedModel, setModel, selectedService, setService } = useModelStore();
  const { chats, setChats, handleStream, isStreamProcessing } = useChatStream();
  const trpc = useTRPC();

  const [isFetchLoading, setIsFetchLoading] = useState<boolean>(false);
  const [textareaPlaceholder, setTextareaPlaceholder] = useState<string>('Choose model...');
  const [provider, setProvider] = useState<Provider | undefined>(undefined);
  const [chatError, setChatError] = useState<ChatError>({ isError: false, errorMessage: '' });

  // TODO: Maybe convert to useReduce
  const [currentChatHistoryId, setCurrentChatHistoryId] = useState<string | undefined>(undefined);
  const [chatTitle, setChatTitle] = useState<string | undefined>(undefined);
  const [chatTitlePersisted, setChatTitlePersisted] = useState<boolean>(false);
  const [generatingTitle, setGeneratingTitle] = useState<boolean>(false);

  const [attachments, setAttachments] = useState<FileInfo[]>([]);

  const apiService = useMemo(() => new ApiService(), []);
  const providerFactory = useMemo(() => new ProviderFactory(apiService), [apiService]);

  const updateChatHistory = useMutation(
    trpc.chatHistory.insertUpdate.mutationOptions({
      onSuccess: async () => {
        if (!chatTitle) {
          invalidateChatHistory();
        }
      },
    })
  );

  const updateChatHistoryTitle = useMutation(
    trpc.chatHistory.updateTitle.mutationOptions({
      onSuccess: async (data) => {
        invalidateChatHistory();
        if (data === currentChatHistoryId) {
          setChatTitlePersisted(true);
        }
      },
      onError: async (err) => {
        console.error('Error updating chat history title:', err);
        invalidateChatHistory();
      },
    })
  );

  const invalidateChatHistory = () => {
    queryClient.invalidateQueries({ queryKey: trpc.chatHistory.all.queryKey() });
  };

  const generateAndPersistChatTitle = () => {
    if (!chatTitle && currentChatHistoryId && !chatTitlePersisted && chats.length > 1) {
      const userChats = chats.filter((chat) => (chat as TCustomChatMessage)?.role === ChatRole.USER);
      if (userChats.length > 0) {
        const lastChat = userChats[userChats.length - 1];
        if (lastChat?.streamComplete === true) {
          const firstUserMessage = (lastChat as TCustomChatMessage)?.content as string;

          if (firstUserMessage && firstUserMessage.length > 1 && !generatingTitle) {
            setGeneratingTitle(true);
            generateTitle(firstUserMessage).then((title) => {
              if (title) {
                setChatTitle(title);
                setGeneratingTitle(false);
                if (currentChatHistoryId) {
                  updateChatHistoryTitle.mutateAsync({
                    id: currentChatHistoryId,
                    title: title,
                  });
                }
              }
            });
          }
        }
      }
    }
  };

  useEffect(() => {
    if (selectedModel != null && !currentChatHistoryId) {
      setChats([
        {
          content: systemPrompt || '',
          role: ChatRole.SYSTEM,
          provider: { provider: selectedService?.serviceId ?? '', model: selectedModel },
          streamComplete: true,
          isReasoning: false,
        },
      ]);
      setTextareaPlaceholder('Ask me anything...');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModel]);

  useEffect(() => {
    if (!queryChatHistoryId) {
      onResetChat();
      setCurrentChatHistoryId(undefined);
      setChatTitle(undefined);
      setChatTitlePersisted(false);
      return;
    }

    if (currentChatHistoryId && currentChatHistoryId === queryChatHistoryId) {
      return;
    }

    setCurrentChatHistoryId(queryChatHistoryId);

    getSingleChatHistoryById(queryChatHistoryId).then((result) => {
      if (!result.isError) {
        if (result.title && result.title !== newThreadTitle) {
          setChatTitle(result.title);
          setChatTitlePersisted(true);
        }
        setChats(result.messages);
        delayHighlighter();
      } else {
        toast.error('Error loading chat history', {
          description: result.error?.message,
        });
        console.error('Error loading chat history:', result.error);
      }
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryChatHistoryId]);

  useEffect(() => {
    if (currentChatHistoryId && currentChatHistoryId !== queryChatHistoryId) {
      const params = new URLSearchParams(searchParams);
      params.set('id', currentChatHistoryId);

      router.push(`/?${params.toString()}`);
    }

    generateAndPersistChatTitle();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatTitle, currentChatHistoryId, chatTitlePersisted]);

  const saveChatHistory = async (messages: TCustomMessage[]) => {
    const id = await updateChatHistory.mutateAsync({
      id: currentChatHistoryId,
      title: chatTitle ?? newThreadTitle,
      messages: messages,
    });

    return id;
  };

  useEffect(() => {
    const nonSystemChats = chats.filter((chat) => (chat as TCustomChatMessage)?.role !== ChatRole.SYSTEM);
    if (nonSystemChats.length >= 1 && nonSystemChats[nonSystemChats.length - 1]?.streamComplete === true) {
      saveChatHistory(chats).then((id) => {
        if (id !== currentChatHistoryId) {
          setCurrentChatHistoryId(id);
        }
      });
    }

    generateAndPersistChatTitle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chats]);

  const chatStream = async (message: TCustomMessage) => {
    if (selectedModel == null || selectedService == null) {
      return;
    }

    setIsFetchLoading(true);

    const providerInstance = providerFactory.getInstance(selectedService);
    if (!providerInstance) {
      toast.error('Provider not found');
      return;
    }

    setProvider(providerInstance);

    const response = await providerInstance.chatCompletions(
      selectedModel,
      [...chats, message],
      selectedService.url,
      selectedService.apiKey
    );

    setChatError(response.error);
    setIsFetchLoading(false);
    await handleStream(
      response.stream,
      { provider: selectedService.serviceId, model: selectedModel },
      providerInstance.convertResponse
    );

    setIsFetchLoading(false);
  };

  const chatImage = async (prompt: string) => {
    if (selectedModel == null || selectedService == null) {
      return;
    }

    const providerInstance = providerFactory.getInstance(selectedService);
    if (!providerInstance) {
      toast.error('Provider not found');
      return;
    }

    setProvider(providerInstance);

    setIsFetchLoading(true);
    const response = await providerInstance.generateImage(
      prompt,
      selectedModel,
      selectedService.url,
      selectedService.apiKey
    );

    if (response.error) {
      setIsFetchLoading(false);
      return;
    }

    setChats((prevArray) => [
      ...prevArray,
      {
        ...response.data[0],
        provider: { provider: selectedService?.serviceId ?? '', model: selectedModel ?? '' },
        streamComplete: true,
        isReasoning: false,
      },
    ]);
    setIsFetchLoading(false);
  };

  const generateTitle = async (message: string): Promise<string | undefined> => {
    let title = undefined;

    if (selectedModel == null || selectedService == null) {
      return title;
    }

    const systemPrompt = systemPromptForChatTitle.replace(SystemPromptVariable.chatHistoryInput, message);

    const chatMessage = {
      content: systemPrompt,
      role: ChatRole.USER,
      provider: { provider: selectedService?.serviceId ?? '', model: selectedModel ?? '' },
      streamComplete: true,
      isReasoning: false,
    };

    try {
      const providerInstance = providerFactory.getInstance(selectedService);
      if (providerInstance) {
        setProvider(providerInstance);
        const response = await providerInstance.chatCompletions(
          selectedModel,
          [chatMessage],
          selectedService.url,
          selectedService.apiKey
        );

        const decoder = new TextDecoder('utf-8');
        const titleChunks = [];

        try {
          while (true) {
            const { done, value } = await response.stream.read();
            if (done) break;

            const text = decoder.decode(value, { stream: true });
            const objects = text.split('\n');

            for (const obj of objects) {
              const jsonString = removeJunkStreamData(obj);

              if (jsonString.length > 0 && isValidJson(jsonString)) {
                const responseData = providerInstance.convertResponse(jsonString);
                titleChunks.push(responseData.choices[0]?.delta.content as string);
              }
            }
          }
        } finally {
          // Flush the decoder when done
          decoder.decode(new Uint8Array(0), { stream: false });
        }

        title = titleChunks.join('');
        if (title.length > 1) {
          title = title
            .replace(/<think>[\s\S]*?<\/think>/g, '')
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .replace(/\n+$/, '')
            .replace(/undefined/g, '');

          if (isValidJson(title)) {
            title = JSON.parse(title).title;
          } else {
            console.warn(`Invalid JSON for title: `, title);
            title = cleanString(title);
          }
        }
      }
    } catch (err) {
      toast.error('Failed to generate title', {
        description: typeof err === 'string' ? err : JSON.stringify(err),
      });
    }

    return title;
  };

  const sendChatGenerateImage = async (chatInput: string) => {
    const prompt = chatInput.replace('/image', '');
    const chatMessage = {
      content: prompt,
      role: ChatRole.USER,
      provider: { provider: selectedService?.serviceId ?? '', model: selectedModel ?? '' },
      streamComplete: true,
      isReasoning: false,
    };
    setChats((prevArray) => [...prevArray, chatMessage]);
    await chatImage(prompt);
  };

  const sendChatCompletion = async (chatInput: string) => {
    const chatMessage = {
      content: chatInput,
      role: ChatRole.USER,
      provider: { provider: selectedService?.serviceId ?? '', model: selectedModel ?? '' },
      streamComplete: true,
      isReasoning: false,
    } as TCustomMessage;

    if (attachments && attachments.length > 0) {
      const textContent: TContentText = { text: chatInput, type: 'text' };
      const images: TContentImage[] = [];

      attachments.forEach((file) => {
        images.push({
          type: 'image_url',
          image_url: { url: file.dataUrl ?? '' },
          meta: { filename: file.filename, size: formatBytes(file.sizeInBytes) },
        });
      });

      (chatMessage as TCustomChatMessage).content = [textContent, ...images];
    }

    setChats((prevArray) => [...prevArray, chatMessage]);
    await chatStream(chatMessage);
    delayHighlighter();
  };

  const sendChat = async (chatInput: string) => {
    if (chatInput === '') {
      return;
    }

    // Start timer here
    const startTime = performance.now();
    console.log(`-> Start timer here!`);
    if (chatInput.startsWith('/image')) {
      await sendChatGenerateImage(chatInput);
      return;
    }

    await sendChatCompletion(chatInput);
    // Stop timer here
    const endTime = performance.now();
    const duration = endTime - startTime;
    console.log(`-> Chat operation took ${duration.toFixed(2)}ms`);

    setAttachments([]);
  };

  const onResetChat = () => {
    setChats([]);
  };

  return (
    <>
      <main className="flex-1 space-y-4 overflow-y-auto px-3" ref={mainDiv}>
        {modelList.modelsIsError && <AlertBox title="Error" description={modelList.modelsError?.message ?? ''} />}
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

        {selectedModel != null && chats.length === 1 && (
          <h2 className="mt-2 scroll-m-20 text-center text-2xl font-semibold tracking-tight transition-colors first:mt-0">
            How can I help you today?
          </h2>
        )}

        {chatError.isError && <AlertBox title="Error" description={chatError.errorMessage ?? ''} />}
        <Chat isFetchLoading={isFetchLoading} chats={chats} mainDiv={mainDiv} />
      </main>
      <section className="sticky top-[100vh] py-3">
        <ChatInput
          onSendInput={sendChat}
          onCancelStream={provider?.cancelChatCompletionStream ?? (() => {})}
          onReset={onResetChat}
          files={attachments}
          setFiles={setAttachments}
          chatInputPlaceholder={textareaPlaceholder}
          isStreamProcessing={isStreamProcessing}
          isFetchLoading={isFetchLoading}
          isLlmModelActive={selectedModel != null}
        />
      </section>
    </>
  );
};
