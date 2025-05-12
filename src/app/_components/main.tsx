'use client';

import { type FC, useState, useRef, useEffect } from 'react';
import {
  type TContentImage,
  type TContentText,
  type TCustomChatMessage,
  type TCustomContext,
  type TCustomMessage,
  ChatRole,
  CustomChatMessageSchema,
  CustomContextSchema,
  CustomMessageSchema,
} from '@/lib/types';
import { AlertBox } from '@/components/alert-box';
import { cleanString, delayHighlighter, formatBytes, isValidJson, removeJunkStreamData } from '@/lib/utils';
import { ChatInput } from '@/components/chat-input';
import { Chat } from '@/components/chat';
import { useChatStream } from '@/hooks/use-chat-stream';
import { useModels } from '@/hooks/use-models';
import { useModelStore } from '@/lib/model-store';
import ProviderModelMenu from '@/components/provider-model-menu';
import { toast } from 'sonner';
import { type ChatError } from '@/lib/api-service';
import { useMutation } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { queryClient, useTRPC } from '@/trpc/react';
import type { FileInfo } from '../upload/upload-types';
import { useProvider } from '@/hooks/use-provider';
import { TrpcQuery } from '@/trpc/queries';
import { validate as ValidateUUID } from 'uuid';
import { useSettings } from '@/hooks/use-settings';
import { Constants } from '@/lib/constants';

export const Main: FC = () => {
  const newThreadTitle = 'New Thread';
  const mainDiv = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const queryChatHistoryId = searchParams.get('id');
  const queryContextId = searchParams.get('contextid');

  const { providers, systemPrompt, systemPromptForRagSlim, systemPromptForChatTitle } = useSettings();
  const { models } = useModels();
  const { selectedModel, setModel, selectedProvider, setProvider } = useModelStore();
  const { chats, setChats, handleStream, isStreamProcessing } = useChatStream();
  const { provider } = useProvider(selectedProvider);
  const trpcRouter = useTRPC();

  const [isFetchLoading, setIsFetchLoading] = useState<boolean>(false);
  const [textareaPlaceholder, setTextareaPlaceholder] = useState<string>('Choose model...');
  const [chatError, setChatError] = useState<ChatError>({ isError: false, errorMessage: '' });
  const [currentChatHistoryId, setCurrentChatHistoryId] = useState<string | undefined>(undefined);
  const [chatTitle, setChatTitle] = useState<string | undefined>(undefined);
  const [chatTitlePersisted, setChatTitlePersisted] = useState<boolean>(false);
  const [generatingTitle, setGeneratingTitle] = useState<boolean>(false);
  const [attachments, setAttachments] = useState<FileInfo[]>([]);
  const [contextId, setContextId] = useState<string | null>(null);

  const updateChatHistory = useMutation(
    trpcRouter.chatHistory.insertUpdate.mutationOptions({
      onSuccess: async () => {
        if (!chatTitle) {
          invalidateChatHistory();
        }
      },
    })
  );

  const updateChatHistoryTitle = useMutation(
    trpcRouter.chatHistory.updateTitle.mutationOptions({
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
    queryClient.invalidateQueries({ queryKey: trpcRouter.chatHistory.all.queryKey() });
  };

  const generateAndPersistChatTitle = () => {
    if (chatTitle || !currentChatHistoryId || chatTitlePersisted || chats.length <= 1 || generatingTitle) {
      return;
    }

    const userChats = chats.filter((chat) => (chat as TCustomChatMessage)?.role === ChatRole.USER);
    if (userChats.length === 0) {
      return;
    }

    const firstUserChat = userChats[0];
    if (!firstUserChat?.streamComplete) {
      return;
    }

    const firstUserMessage = (firstUserChat as TCustomChatMessage)?.content as string;
    if (!firstUserMessage || firstUserMessage.length <= 1) {
      return;
    }

    setGeneratingTitle(true);
    generateTitle(firstUserMessage).then((title) => {
      if (title) {
        setChatTitle(title);

        if (currentChatHistoryId && !updateChatHistoryTitle.isPending) {
          updateChatHistoryTitle.mutateAsync({
            id: currentChatHistoryId,
            title: title,
          });
        }
      }
    });
  };

  useEffect(() => {
    if (selectedModel == null) {
      setTextareaPlaceholder('Choose model...');
    } else if (!currentChatHistoryId) {
      setChats([
        CustomMessageSchema.parse({
          content: systemPrompt ?? '',
          role: ChatRole.SYSTEM,
          provider: { provider: selectedProvider?.providerId ?? '', model: selectedModel },
        }),
      ]);
      setTextareaPlaceholder('Start typing here...');
      setGeneratingTitle(false);
    } else {
      setTextareaPlaceholder('Start typing here...');
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModel]);

  useEffect(() => {
    if (queryContextId) {
      setContextId(queryContextId);
    }
  }, [queryContextId]);

  useEffect(() => {
    if (!queryChatHistoryId) {
      onResetChat();
      setCurrentChatHistoryId(undefined);
      setChatTitle(undefined);
      setChatTitlePersisted(false);
      setGeneratingTitle(false);
      return;
    }

    if (currentChatHistoryId && currentChatHistoryId === queryChatHistoryId) {
      return;
    }

    setCurrentChatHistoryId(queryChatHistoryId);

    TrpcQuery.getSingleChatHistoryById(queryChatHistoryId).then((result) => {
      if (result.isError || !result.data) {
        toast.error('Error loading chat history', {
          description: result.error?.message,
        });
        console.error('Error loading chat history:', result.error);
        return;
      }

      const response = result.data;
      if (response.title && response.title !== newThreadTitle) {
        setChatTitle(response.title);
        setChatTitlePersisted(true);
      } else {
        setChatTitlePersisted(false);
      }
      setGeneratingTitle(false);
      setChats(response.messages);
      delayHighlighter();
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
    if (!updateChatHistory.isPending) {
      const id = await updateChatHistory.mutateAsync({
        id: currentChatHistoryId,
        title: chatTitle ?? newThreadTitle,
        messages: messages,
      });

      return id;
    }
  };

  useEffect(() => {
    const nonSystemChats = chats.filter((chat) => (chat as TCustomChatMessage)?.role !== ChatRole.SYSTEM);
    if (nonSystemChats.length >= 1 && nonSystemChats[nonSystemChats.length - 1]?.streamComplete === true) {
      saveChatHistory(chats).then((id) => {
        if (id && id !== currentChatHistoryId) {
          setCurrentChatHistoryId(id);
        }
      });
    }

    generateAndPersistChatTitle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chats]);

  const callChatCompletions = async (messages: TCustomMessage[], context: TCustomContext | undefined) => {
    if (selectedModel == null || selectedProvider == null) {
      return;
    }

    if (!provider) {
      toast.error('Provider not found');
      return;
    }

    const chatMessages = [...chats, ...messages];
    const response = await provider.chatCompletions(
      selectedModel,
      chatMessages,
      selectedProvider.url,
      selectedProvider.apiKey,
      true
    );

    setChatError(response.error);
    setIsFetchLoading(false);

    await handleStream(
      response.stream,
      CustomMessageSchema.parse({
        content: '',
        role: ChatRole.ASSISTANT,
        provider: { provider: selectedProvider.providerId, model: selectedModel },
        streamComplete: false,
        context: context,
      }),
      provider.convertResponse
    );
  };

  const callImageGeneration = async (prompt: string) => {
    if (selectedModel == null || selectedProvider == null) {
      return;
    }

    if (!provider) {
      toast.error('Provider not found');
      return;
    }

    const response = await provider.generateImage(prompt, selectedModel, selectedProvider.url, selectedProvider.apiKey);
    if (response.notImplementedOrSupported) {
      setChats((prevArray) => [
        ...prevArray,
        CustomChatMessageSchema.parse({
          content: 'Not supported/implemented',
          provider: { provider: selectedProvider?.providerId ?? '', model: selectedModel ?? '' },
        }),
      ]);
      return;
    }
    if (response.error) {
      return;
    }

    setChats((prevArray) => [
      ...prevArray,
      CustomMessageSchema.parse({
        ...response.data[0],
        provider: { provider: selectedProvider?.providerId ?? '', model: selectedModel ?? '' },
      }),
    ]);
  };

  const generateTitle = async (message: string): Promise<string | undefined> => {
    let title = undefined;

    if (selectedModel == null || selectedProvider == null) {
      return title;
    }

    if (!provider) {
      toast.error('Provider not found');
      return title;
    }

    const systemPrompt = systemPromptForChatTitle.replace(Constants.systemPromptVariables.chatHistoryInput, message);

    const chatMessage = CustomMessageSchema.parse({
      content: systemPrompt,
      role: ChatRole.USER,
      provider: { provider: selectedProvider?.providerId ?? '', model: selectedModel ?? '' },
    });

    const decoder = new TextDecoder('utf-8');

    try {
      const titleModel = provider.titleGenerationModel(selectedModel);
      const response = await provider.chatCompletions(
        titleModel,
        [chatMessage],
        selectedProvider.url,
        selectedProvider.apiKey,
        false
      );

      const titleChunks = [];

      while (true) {
        const { done, value } = await response.stream.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const objects = text.split('\n');

        for (const obj of objects) {
          const jsonString = removeJunkStreamData(obj);

          if (jsonString.length <= 0 || !isValidJson(jsonString)) continue;

          const responseData = provider.convertResponse(jsonString);
          titleChunks.push(responseData.choices[0]?.delta.content as string);
        }
      }

      title = titleChunks.join('');
      if (title.length <= 0) {
        return title;
      }

      title = title
        .replace(/<think>[\s\S]*?<\/think>/g, '')
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .replace(/\n+$/, '')
        .replace(/undefined/g, '');

      if (isValidJson(title)) {
        return JSON.parse(title).title;
      }

      console.warn(`Invalid JSON for title: `, title);
      return cleanString(title);
    } catch (err) {
      console.error('Failed to generate title: ', err);
      toast.error('Failed to generate title', {
        description: typeof err === 'string' ? err : JSON.stringify(err),
      });
    } finally {
      // Flush the decoder when done
      decoder.decode(new Uint8Array(0), { stream: false });
      setGeneratingTitle(false);
    }

    return title;
  };

  const getImageGenerateChatMessage = (chatInput: string): TCustomMessage => {
    const prompt = chatInput.replace('/image', '');
    const chatMessage = CustomMessageSchema.parse({
      content: prompt,
      role: ChatRole.USER,
      provider: { provider: selectedProvider?.providerId ?? '', model: selectedModel ?? '' },
    });

    return chatMessage;
  };

  const getCompletionChatMessage = (chatInput: string, context: TCustomContext | undefined = undefined): TCustomMessage => {
    const chatMessage = CustomMessageSchema.parse({
      content: chatInput,
      role: ChatRole.USER,
      provider: { provider: selectedProvider?.providerId ?? '', model: selectedModel ?? '' },
    });

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

    if (context) {
      chatMessage.context = context;
    }

    return chatMessage;
  };

  const endTimerAndAddToLastChat = (startTime: number) => {
    const endTime = performance.now();
    const duration = endTime - startTime;

    setChats((prevChats) => {
      const updatedChats = [...prevChats];
      if (updatedChats.length > 0) {
        const lastChat = updatedChats[updatedChats.length - 1];
        updatedChats[updatedChats.length - 1] = CustomMessageSchema.parse({
          ...lastChat,
          durationInMs: duration,
        });
      }
      return updatedChats;
    });
  };

  const getRagContentPrompt = async (
    chatInput: string,
    documentId: string
  ): Promise<{ ragPrompt: string | undefined; context: TCustomContext } | undefined> => {
    if (chatInput.length < 1) {
      toast.warning('Ask a question first');
      return;
    }

    if (systemPromptForRagSlim == null) {
      toast.warning('No slim version of the RAG system prompt set!');
      return;
    }

    const documentResponse = await TrpcQuery.getDocument({ documentId });
    if (documentResponse.isError || !documentResponse.data) {
      toast.error(documentResponse.error?.message);
      return;
    }

    const { embedProviderName, embedModel, id, filename } = documentResponse.data;

    if (!embedModel) {
      toast.warning('No embedding model found for this document.');
      return;
    }

    const embedProvider = providers.find((s) => s.providerId == embedProviderName);
    if (embedProvider === undefined) {
      toast.warning(
        `Settings for service '${embedProviderName}' has been removed at some point. Please add them under settings.`
      );
      return;
    }

    const chunksResult = await TrpcQuery.getDocumentChunks({
      question: chatInput,
      documentId: id,
      embedModel: embedModel,
      providerSetting: embedProvider,
    });

    if (chunksResult.isError || !chunksResult.data) {
      const errorMessage =
        (chunksResult.error?.message?.length ?? 0 > 200)
          ? `${chunksResult.error?.message?.slice(0, 247)}...`
          : chunksResult.error?.message;
      toast.error(chunksResult.error ? errorMessage : 'An error occurred');
      return;
    }

    const mergedResults = chunksResult.data.map((doc) => doc.text).join(' ');
    const ragPrompt = systemPromptForRagSlim
      .replace(Constants.systemPromptVariables.userQuestion, chatInput)
      .replace(Constants.systemPromptVariables.documentContent, mergedResults);

    const context = CustomContextSchema.parse({
      contextId: id.toString(),
      name: filename,
    });

    return { ragPrompt, context };
  };

  const getRagContext = async (
    chatInput: string
  ): Promise<{ chatMessage: TCustomMessage; context: TCustomContext } | undefined> => {
    if (contextId && ValidateUUID(contextId)) {
      const ragResponse = await getRagContentPrompt(chatInput, contextId);
      if (!ragResponse) {
        return;
      }

      const systemPromptMessage = CustomMessageSchema.parse({
        content: ragResponse.ragPrompt,
        role: ChatRole.SYSTEM,
        provider: { provider: selectedProvider?.providerId ?? '', model: selectedModel ?? '' },
      });

      return { chatMessage: systemPromptMessage, context: ragResponse.context };
    }
  };

  const sendChat = async (chatInput: string) => {
    if (chatInput === '') {
      return;
    }

    setIsFetchLoading(true);
    const startTime = performance.now();

    if (contextId === 'image') {
      const chatMessage = getImageGenerateChatMessage(chatInput) as TCustomChatMessage;
      if (!chatMessage || typeof chatMessage.content !== 'string') return;
      setChats((prevArray) => [...prevArray, chatMessage]);
      await callImageGeneration(chatMessage.content);

      setIsFetchLoading(false);
      endTimerAndAddToLastChat(startTime);
      setAttachments([]);
      return;
    }

    const ragContext = await getRagContext(chatInput);
    const context = ragContext?.context;

    const chatMessage = getCompletionChatMessage(chatInput, context);
    setChats((prevArray) => [...prevArray, chatMessage]);
    const messages: TCustomMessage[] = [chatMessage];

    if (ragContext?.chatMessage) {
      messages.push(ragContext.chatMessage);
    }
    await callChatCompletions(messages, context);

    delayHighlighter();
    setIsFetchLoading(false);
    endTimerAndAddToLastChat(startTime);
    setAttachments([]);
  };

  const onResetChat = () => {
    setChats([]);
  };

  const onCancelStream = () => {
    if (selectedProvider == null) {
      return;
    }

    if (!provider) {
      toast.error('Provider not found');
      return;
    }

    provider.cancelChatCompletionStream();
  };

  const onContextChange = (contextId: string | null) => {
    setContextId(contextId);
  };

  return (
    <>
      <section className="bg-background sticky top-0 z-10 w-full px-3 pb-3">
        {models.modelsIsError && <AlertBox title="Error" description={models.modelsError?.message ?? ''} />}
        <ProviderModelMenu
          embeddingModels={false}
          selectedProvider={selectedProvider}
          selectedModel={selectedModel}
          models={models.data}
          modelsIsSuccess={models.modelsIsSuccess}
          modelsIsLoading={models.modelsIsLoading}
          onModelChange={(model) => {
            setModel(model);
          }}
          onProviderChange={(provider) => {
            setProvider(provider);
            setModel(null);
          }}
          onReset={() => {
            setProvider(null);
            setModel(null);
          }}
        />
      </section>
      <main className="flex-1 space-y-4 overflow-y-auto px-3" ref={mainDiv}>
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
          onCancelStream={onCancelStream}
          onReset={onResetChat}
          onContextChange={onContextChange}
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
