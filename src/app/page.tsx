'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { ArrowUpIcon } from '@radix-ui/react-icons';
import { ChatBubble } from '@/components/chat-bubble';
import { ModelMenu } from '@/components/model-menu';
import { Spinner } from '@/components/spinner';
import { PageDownButton } from '@/components/page-down-button';
import { useQuery } from '@tanstack/react-query';
import { ChatMessage, ChatRole, TModelsResponseSchema } from '@/lib/types';
import { useModelStore, useSettingsStore } from '@/lib/store';
import { api } from '@/lib/api';
import { AlertBox } from '@/components/alert-box';
import { delayHighlighter, parseJsonStream } from '@/lib/utils';
import { ChatInput } from '@/components/chat-input';
import { useScrollBottom } from '@/hooks/use-scroll-bottom';

export default function Home() {
  const { modelName, updateModelName } = useModelStore();
  const { modelVariant, hostname, token, systemPrompt, hasHydrated } = useSettingsStore();
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [working, setWorking] = useState<boolean>(false);
  const mainDiv = useRef<HTMLDivElement>(null);
  const chatsDiv = useRef<HTMLDivElement>(null);
  const { isScrollBottom } = useScrollBottom(mainDiv);
  const textareaPlaceholder = useRef<string>('Choose model...');
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

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
    const scrollToBottom = () => {
      if (mainDiv.current != null) {
        mainDiv.current.scrollTop = mainDiv.current.scrollHeight;
        setTimerRunning(false);
      }
    };

    const delayedScrollToBottom = () => {
      const id = setTimeout(() => {
        scrollToBottom();
      }, 100);
      setTimeoutId(id);
      setTimerRunning(true);
    };

    if (!isScrollBottom && timeoutId != null) {
      clearTimeout(timeoutId);
      setTimerRunning(false);
    }

    if (isScrollBottom && !timerRunning) {
      delayedScrollToBottom();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chats]);

  useEffect(() => {
    if (modelName != null) {
      setChats((prevArray) => [...prevArray, { content: systemPrompt || '', role: ChatRole.SYSTEM }]);
      textareaPlaceholder.current = 'Ask me anything...';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelName]);

  const directScrollToBottom = () => {
    if (mainDiv.current != null) {
      mainDiv.current.scrollTop = mainDiv.current.scrollHeight;
    }
  };

  const updateLastChatsItem = (type: string, content: string = '') => {
    setChats((prevArray) => {
      return prevArray.map((chat, index) => {
        if (index === prevArray.length - 1) {
          if (type === 'replace') {
            chat.content = chat.content.replace(/[\n\s]+$/, '');
          } else if (type === 'update') {
            chat.content = content;
          }
        }
        return chat;
      });
    });
  };

  const chatStream = async (message: ChatMessage) => {
    if (modelName == null) {
      return;
    }

    setLoading(true);

    try {
      const streamReader = await api.getChatStream(modelName, [...chats, message], token, hostname);
      setLoading(false);

      let assistantChatMessage = '';
      const decoder = new TextDecoder();

      setChats((prevArray) => [...prevArray, { content: assistantChatMessage, role: ChatRole.ASSISTANT }]);

      let checkFirstCharSpacing = true;
      while (true) {
        const { done, value } = await streamReader.read();

        if (done) {
          updateLastChatsItem('replace');
          break;
        }

        const decodedChunk = decoder.decode(value, { stream: true });
        const chunkList = parseJsonStream(decodedChunk);
        if (chunkList != null && chunkList.length > 0) {
          for (const chunkObj of chunkList) {
            if (chunkObj?.id == null) {
              continue;
            }

            let chunkContent = chunkObj.choices[0].delta.content;
            if (checkFirstCharSpacing && /\S/.test(chunkContent)) {
              // Remove eventual initial linebreaks and spaces
              assistantChatMessage = '';
              chunkContent = chunkContent.trimStart();
              checkFirstCharSpacing = false;
            }

            assistantChatMessage += chunkContent;

            updateLastChatsItem('update', assistantChatMessage);
          }
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          setChats((prevArray) => [...prevArray, { content: 'Cancel', role: ChatRole.USER }]);
        } else {
          setChats((prevArray) => [...prevArray, { content: (error as Error).message, role: ChatRole.SYSTEM }]);
        }
      } else {
        console.error(error);
      }
      setLoading(false);
      setWorking(false);
    }
  };

  const sendChat = async (chatInput: string) => {
    if (chatInput === '') {
      return;
    }
    setWorking(true);
    const chatMessage = { content: chatInput, role: ChatRole.USER };
    setChats((prevArray) => [...prevArray, chatMessage]);
    await chatStream(chatMessage);
    setWorking(false);
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

        {modelName != null && (
          <section className="mt-3 w-full space-y-4" ref={chatsDiv}>
            {chats.length === 1 ? (
              <h2 className="mt-10 scroll-m-20 pb-2 text-center text-3xl font-semibold tracking-tight transition-colors first:mt-0">
                How can I help you today?
              </h2>
            ) : (
              <>
                {chats.map((message, index) => (
                  <ChatBubble role={message.role} content={message.content} key={index} />
                ))}
                {loading && <Spinner />}
              </>
            )}
          </section>
        )}

        {!isScrollBottom && (
          <PageDownButton
            onClick={directScrollToBottom}
            className="animate-bounce-short absolute bottom-24 left-1/2 animate-bounce rounded-full hover:animate-none"
          />
        )}
      </main>

      <section className="relative py-3">
        <ChatInput
          onSendInputAsync={sendChat}
          onCancelStream={api.cancelChatStream}
          placeholder={textareaPlaceholder.current}
          workingStream={working}
        />
      </section>
    </>
  );
}
