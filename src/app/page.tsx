'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { ArrowUpIcon } from '@radix-ui/react-icons';
import { ModelMenu } from '@/components/model-menu';
import { Spinner } from '@/components/spinner';
import { useQuery } from '@tanstack/react-query';
import { ChatMessage, ChatRole, TModelsResponseSchema } from '@/lib/types';
import { useModelStore, useSettingsStore } from '@/lib/store';
import { api } from '@/lib/api';
import { AlertBox } from '@/components/alert-box';
import { delayHighlighter } from '@/lib/utils';
import { ChatInput } from '@/components/chat-input';
import { Chat } from '@/components/chat';
import { useChatStream } from '@/hooks/use-chat-stream';

export default function Home() {
  const { modelName, updateModelName } = useModelStore();
  const { modelVariant, hostname, token, systemPrompt, hasHydrated } = useSettingsStore();
  const [isFetchLoading, setIsFetchLoading] = useState<boolean>(false);
  const mainDiv = useRef<HTMLDivElement>(null);
  const textareaPlaceholder = useRef<string>('Choose model...');
  const { chats, setChats, handleStream, isStreamProcessing } = useChatStream();

  const {
    isLoading: modelsIsLoading,
    error: modelsError,
    data: models,
    isSuccess: modelsIsSuccess,
    isError: modelsIsError,
  } = useQuery<TModelsResponseSchema>({
    queryKey: ['models', modelVariant, token, hostname],
    queryFn: async () => {
      switch (modelVariant) {
        case 'ollama': {
          const tags = await api.getTag(hostname);
          return tags.models.map((model) => ({ id: model.name, object: 'model', created: 0 }));
        }
        case 'openai':
          return await api.getModelList(hostname, token);
        case 'manual':
          return [] as TModelsResponseSchema;
      }
      return [] as TModelsResponseSchema;
    },
  });

  useEffect(() => {
    if (modelName != null) {
      setChats((prevArray) => [...prevArray, { content: systemPrompt || '', role: ChatRole.SYSTEM }]);
      textareaPlaceholder.current = 'Ask me anything...';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelName]);

  const chatStream = async (message: ChatMessage) => {
    if (modelName == null) {
      return;
    }

    setIsFetchLoading(true);
    const streamReader = await api.getChatStream(modelName, [...chats, message], token, hostname);
    setIsFetchLoading(false);
    await handleStream(streamReader);
  };

  const sendChat = async (chatInput: string) => {
    if (chatInput === '') {
      return;
    }
    const chatMessage = { content: chatInput, role: ChatRole.USER };
    setChats((prevArray) => [...prevArray, chatMessage]);
    await chatStream(chatMessage);
    delayHighlighter();
  };

  const renderModelListVariant = () => {
    if (modelName == null) {
      switch (modelVariant) {
        case 'manual':
          return (
            <Input
              placeholder="Modelname"
              className="mt-2 w-80"
              onChange={(e) => {
                updateModelName(e.target.value);
              }}
            />
          );
        case 'ollama':
        case 'openai':
          return (
            <div className="flex pt-2">
              <ModelMenu models={models ?? []} disabled={!modelsIsSuccess} className="py-3" />
              {modelsIsLoading && (
                <span className="ml-2">
                  <Spinner />
                </span>
              )}
            </div>
          );
        default:
          return (
            <span className="flex items-center px-4 pt-2">
              {hasHydrated ? (
                <>
                  <h4 className="text-xl font-semibold">Configure settings to begin chat</h4>
                  <ArrowUpIcon className="ml-2" />
                </>
              ) : (
                <Spinner />
              )}
            </span>
          );
      }
    }
    return <></>;
  };

  return (
    <>
      <main className="flex-1 space-y-4 overflow-y-auto" ref={mainDiv}>
        {modelsIsError && <AlertBox title="Error" description={modelsError.message} />}
        {renderModelListVariant()}

        {modelName != null && chats.length === 1 && (
          <h2 className="mt-10 scroll-m-20 pb-2 text-center text-3xl font-semibold tracking-tight transition-colors first:mt-0">
            How can I help you today?
          </h2>
        )}

        <Chat isFetchLoading={isFetchLoading} chats={chats} mainDiv={mainDiv} />
      </main>
      <section className="sticky top-[100vh] py-3">
        <ChatInput
          onSendInput={sendChat}
          onCancelStream={api.cancelChatStream}
          chatInputPlaceholder={textareaPlaceholder.current}
          isStreamProcessing={isStreamProcessing}
          isFetchLoading={isFetchLoading}
          isLlmModelActive={modelName != null}
        />
      </section>
    </>
  );
}
