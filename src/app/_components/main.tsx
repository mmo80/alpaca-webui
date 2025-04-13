'use client';

import { type FC, useState, useRef, useEffect } from 'react';
import { type TCustomChatMessage, type TCustomMessage, ChatRole } from '@/lib/types';
import { AlertBox } from '@/components/alert-box';
import { cleanString, delayHighlighter, isValidJson, removeJunkStreamData } from '@/lib/utils';
import { ChatInput } from '@/components/chat-input';
import { Chat } from '@/components/chat';
import { useChatStream } from '@/hooks/use-chat-stream';
import { useModelList } from '@/hooks/use-model-list';
import { SystemPromptVariable, useSettingsStore } from '@/lib/settings-store';
import { useModelStore } from '@/lib/model-store';
import ModelAlts from '@/components/model-alts';
import { apiAction } from '@/lib/api';
import { toast } from 'sonner';
import { ApiService, type ChatError } from '@/lib/api-service';
import { ProviderFactory } from '@/lib/providers/provider-factory';
import { type Provider } from '@/lib/providers/provider';
import { useMutation } from '@tanstack/react-query';
import { getSingleChatHistoryById, useChatHistoryMutation } from '@/trpc/queries';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTRPC } from '@/trpc/react';

export const Main: FC = () => {
  const newThreadTitle = 'New Thread';

  const { selectedModel, setModel, selectedService, setService } = useModelStore();
  const { systemPrompt, hasHydrated } = useSettingsStore();
  const [isFetchLoading, setIsFetchLoading] = useState<boolean>(false);
  const mainDiv = useRef<HTMLDivElement>(null);
  const [textareaPlaceholder, setTextareaPlaceholder] = useState<string>('Choose model...');
  const { chats, setChats, handleStream, isStreamProcessing } = useChatStream();
  const { modelList } = useModelList();
  const [provider, setProvider] = useState<Provider | undefined>(undefined);
  const [chatError, setChatError] = useState<ChatError>({ isError: false, errorMessage: '' });
  const [currentChatHistoryId, setCurrentChatHistoryId] = useState<string | undefined>(undefined);
  const { systemPromptForChatTitle } = useSettingsStore();
  const [chatTitle, setChatTitle] = useState<string | undefined>(undefined);
  const [chatTitlePersisted, setChatTitlePersisted] = useState<boolean>(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const queryChatHistoryId = searchParams.get('id');

  const { invalidate: invalidateChatHistory } = useChatHistoryMutation();

  const trpc = useTRPC();
  const updateChatHistory = useMutation(
    trpc.chatHistory.insertUpdate.mutationOptions({
      onSuccess: async () => {
        invalidateChatHistory();
      },
    })
  );

  const updateChatHistoryTitle = useMutation(
    trpc.chatHistory.updateTitle.mutationOptions({
      onSuccess: async () => {
        invalidateChatHistory();
      },
    })
  );

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
        if (result.title !== newThreadTitle) {
          setChatTitlePersisted(true);
        }
        setChats(result.messages);
        delayHighlighter();
      } else {
        console.error('Error loading chat history:', result.error);
      }
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryChatHistoryId]);

  const generateChatTitle = () => {
    if (!chatTitle && !chatTitlePersisted) {
      const titleChats = chats.filter((chat) => (chat as TCustomChatMessage)?.role !== ChatRole.SYSTEM);
      if (titleChats.length === 2 && titleChats[titleChats.length - 1]?.streamComplete === true) {
        console.log('* generate title: ', titleChats.length);
        const firstUserMessage = (titleChats[titleChats.length - 1] as TCustomChatMessage)?.content;
        if (firstUserMessage.length > 1) {
          generateTitle(firstUserMessage).catch((err) => {
            console.error('Error generating title:', err);
          });
        }
      }
    }
  };

  useEffect(() => {
    if (chatTitle && currentChatHistoryId && !chatTitlePersisted) {
      console.log(`Persist chat title: `, chatTitle);
      updateChatHistoryTitle
        .mutateAsync({
          id: currentChatHistoryId,
          title: chatTitle,
        })
        .then((id) => {
          if (id === currentChatHistoryId) {
            setChatTitlePersisted(true);
          }
          console.log('* Title persisted!', id);
        })
        .catch((err) => {
          console.error('Error updating chat history title:', err);
        });
    } else {
      console.log(
        `* chatTitle: ${chatTitle}, currentChatHistoryId: ${currentChatHistoryId}, chatTitlePersisted: ${chatTitlePersisted.toString()}.`
      );
    }
  }, [chatTitle, currentChatHistoryId, chatTitlePersisted]);

  useEffect(() => {
    if (selectedModel != null && !currentChatHistoryId) {
      setChats([
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
      if (chats && chats[chats.length - 1]?.streamComplete === true && chats.length > 1) {
        await saveChatHistory(chats);
      }
    };
    handleSaveChatHistory();

    generateChatTitle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chats]);

  useEffect(() => {
    if (currentChatHistoryId && currentChatHistoryId !== queryChatHistoryId) {
      const params = new URLSearchParams(searchParams);
      params.set('id', currentChatHistoryId);

      router.push(`/?${params.toString()}`);
    }

    if (currentChatHistoryId && currentChatHistoryId === queryChatHistoryId) {
      generateChatTitle();
    }
  }, [currentChatHistoryId]);

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

  const generateTitle = async (message: string) => {
    if (selectedModel == null || selectedService == null) {
      return;
    }

    const systemPrompt = systemPromptForChatTitle.replace(SystemPromptVariable.chatHistoryInput, message);
    console.log('* The message to generate title from:', message);

    const chatMessage = {
      content: systemPrompt,
      role: ChatRole.SYSTEM,
      provider: { provider: selectedService?.serviceId ?? '', model: selectedModel ?? '' },
      streamComplete: true,
    };

    const apiSrv = new ApiService();
    const providerFactory = new ProviderFactory(apiSrv);

    const providerInstance = providerFactory.getInstance(selectedService);
    if (providerInstance) {
      setProvider(providerInstance);
      const response = await providerInstance.chatCompletions(
        selectedModel,
        [chatMessage],
        selectedService.url,
        selectedService.apiKey
      );

      let title = '';
      while (true) {
        const { done, value } = await response.stream.read();
        if (done) break;

        const text = new TextDecoder('utf-8').decode(value);
        const objects = text.split('\n');
        for (const obj of objects) {
          const jsonString = removeJunkStreamData(obj);

          if (jsonString.length > 0 && isValidJson(jsonString)) {
            const responseData = providerInstance.convertResponse(jsonString);
            title += responseData.choices[0]?.delta.content;
          }
        }
      }

      if (title.length > 1) {
        title = title
          .replace(/<think>[\s\S]*?<\/think>/g, '')
          .replace(/^```json\n/, '')
          .replace(/\n```$/, '');

        if (isValidJson(title)) {
          title = JSON.parse(title).title;
        } else {
          title = cleanString(title);
        }

        console.log('* set title: ', title);

        setChatTitle(title);
      } else {
        console.log(`* no title? `, title);
      }
    }
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
      title: newThreadTitle,
      messages: messages,
    });

    if (id !== currentChatHistoryId) {
      setCurrentChatHistoryId(id);
    }
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
