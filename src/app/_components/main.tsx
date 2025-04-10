'use client';

import { type FC, useState, useRef, useEffect } from 'react';
import { type TCustomChatMessage, type TCustomMessage, ChatRole } from '@/lib/types';
import { AlertBox } from '@/components/alert-box';
import { delayHighlighter } from '@/lib/utils';
import { ChatInput } from '@/components/chat-input';
import { Chat } from '@/components/chat';
import { useChatStream } from '@/hooks/use-chat-stream';
import { useModelList } from '@/hooks/use-model-list';
import { useSettingsStore } from '@/lib/settings-store';
import { useModelStore } from '@/lib/model-store';
import ModelAlts from '@/components/model-alts';
import { apiAction } from '@/lib/api';
import { toast } from 'sonner';
import { ApiService, type ChatError } from '@/lib/api-service';
import { ProviderFactory } from '@/lib/providers/provider-factory';
import { type Provider } from '@/lib/providers/provider';
import { queryClient, useTRPC } from '@/trpc/react';
import { useMutation } from '@tanstack/react-query';
import { useChatHistoryMutation } from '@/trpc/queries';
import { useSearchParams } from 'next/navigation';

export const Main: FC = () => {
  const { selectedModel, setModel, selectedService, setService } = useModelStore();
  const { systemPrompt, hasHydrated } = useSettingsStore();
  const [isFetchLoading, setIsFetchLoading] = useState<boolean>(false);
  const mainDiv = useRef<HTMLDivElement>(null);
  const [textareaPlaceholder, setTextareaPlaceholder] = useState<string>('Choose model...');
  const { chats, setChats, handleStream, isStreamProcessing } = useChatStream();
  const { modelList } = useModelList();
  const [provider, setProvider] = useState<Provider | undefined>(undefined);
  const [chatError, setChatError] = useState<ChatError>({ isError: false, errorMessage: '' });
  const [currentChatHistoryId, setCurrentChatHistoryId] = useState<string>();

  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const { invalidate: invalidateChatHistory } = useChatHistoryMutation();

  const trpc = useTRPC();
  const updateChatHistory = useMutation(
    trpc.chatHistory.insertUpdate.mutationOptions({
      onSuccess: async () => {
        invalidateChatHistory();
      },
    })
  );

  useEffect(() => {
    if (!id) return;

    setCurrentChatHistoryId(id);

    const queryOptions = trpc.chatHistory.get.queryOptions({ id: id });

    queryClient
      .fetchQuery(queryOptions)
      .then((result) => {
        if (result) {
          const parsedMessages = JSON.parse(result.messages);
          const chatMessages = parsedMessages.map((msg: TCustomMessage) => ({
            role: (msg as TCustomChatMessage).role,
            content: (msg as TCustomChatMessage).content,
            provider: (msg as TCustomChatMessage).provider,
            reasoning_content: (msg as TCustomChatMessage).reasoning_content,
          }));

          console.log(`* chatMessages from chat history: ${id}`, chatMessages);
          setChats(chatMessages);
          delayHighlighter();
        }
      })
      .catch((err: Error) => {
        console.error(err);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (selectedModel != null && !currentChatHistoryId) {
      setChats((prevArray) => [
        ...prevArray,
        {
          content: systemPrompt || '',
          role: ChatRole.SYSTEM,
          provider: { provider: selectedService?.serviceId ?? '', model: selectedModel },
          streamComplete: true,
        },
      ]);
      setTextareaPlaceholder('Ask me anything...');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModel]);

  useEffect(() => {
    const handleSaveChatHistory = async () => {
      if (chats && chats[chats.length - 1]?.streamComplete === true) {
        console.log('* latest chats: ', chats);
        await saveChatHistory(chats);
      }
    };

    handleSaveChatHistory();
    // eslint-disable-next-line react-hSELECT * FROM chat_historiesooks/exhaustive-deps
  }, [chats]);

  const chatStream = async (message: TCustomMessage) => {
    if (selectedModel == null || selectedService == null) {
      return;
    }

    setIsFetchLoading(true);

    const apiSrv = new ApiService();
    const providerFactory = new ProviderFactory(apiSrv);

    const providerInstance = providerFactory.getInstance(selectedService);
    if (providerInstance) {
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
    }

    setIsFetchLoading(false);
  };

  const chatImage = async (prompt: string) => {
    if (selectedModel == null || selectedService == null) {
      return;
    }
    if (!selectedModel.startsWith('dall-e')) {
      toast.warning(
        'Can only generate image with OpenAI <strong><u>dall-e-3</u></strong> or <strong><u>dall-e-2</u></strong> models'
      );
      return;
    }

    setIsFetchLoading(true);
    const response = await apiAction.generateImage(prompt, selectedModel, selectedService.url, selectedService.apiKey);
    setChats((prevArray) => [
      ...prevArray,
      {
        ...response.data[0],
        provider: { provider: selectedService?.serviceId ?? '', model: selectedModel ?? '' },
        streamComplete: true,
      },
    ]);
    setIsFetchLoading(false);
  };

  const sendChat = async (chatInput: string) => {
    if (chatInput === '') {
      return;
    }

    if (chatInput.startsWith('/image')) {
      const prompt = chatInput.replace('/image', '');
      const chatMessage = {
        content: prompt,
        role: ChatRole.USER,
        provider: { provider: selectedService?.serviceId ?? '', model: selectedModel ?? '' },
        streamComplete: true,
      };
      setChats((prevArray) => [...prevArray, chatMessage]);
      await chatImage(prompt);
    } else {
      const chatMessage = {
        content: chatInput,
        role: ChatRole.USER,
        provider: { provider: selectedService?.serviceId ?? '', model: selectedModel ?? '' },
        streamComplete: true,
      };
      setChats((prevArray) => [...prevArray, chatMessage]);
      await chatStream(chatMessage);
      delayHighlighter();
    }
  };

  const saveChatHistory = async (messages: TCustomMessage[]) => {
    const id = await updateChatHistory.mutateAsync({
      id: currentChatHistoryId,
      title: 'test chat',
      messages: messages,
    });

    console.log('* updateChatHistory id:', id);

    setCurrentChatHistoryId(id);
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
        <Chat isFetchLoading={isFetchLoading} chats={chats} mainDiv={mainDiv} onReset={onResetChat} />
      </main>
      <section className="sticky top-[100vh] py-3">
        <ChatInput
          onSendInput={sendChat}
          onCancelStream={provider?.cancelChatCompletionStream ?? (() => {})}
          chatInputPlaceholder={textareaPlaceholder}
          isStreamProcessing={isStreamProcessing}
          isFetchLoading={isFetchLoading}
          isLlmModelActive={selectedModel != null}
        />
      </section>
    </>
  );
};
