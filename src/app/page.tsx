'use client';

import { useState, useRef, useEffect, RefObject } from 'react';
import { Input } from '@/components/ui/input';
import { ArrowUpIcon } from '@radix-ui/react-icons';
import { ChatBubble } from '@/components/chat-bubble';
import { ModelMenu } from '@/components/model-menu';
import { Spinner } from '@/components/spinner';
import { PageDownButton } from '@/components/page-down-button';
import { useQuery } from '@tanstack/react-query';
import { ChatMessage, ChatRole, TModelsResponseSchema } from '@/lib/types';
import { useModelStore, useSettingsStore } from '../lib/store';
import { api } from '../lib/api';
import { AlertBox } from '@/components/alert-box';
import { delayHighlighter, parseJsonStream } from '@/lib/utils';
import ChatInput from '@/components/chat-input';

const systemPromptMessage = 'Hello i am a AI assistant, how can i help you?';

export default function Home() {
  const { modelName, updateModelName } = useModelStore();
  const { modelVariant, hostname, token } = useSettingsStore();
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [working, setWorking] = useState<boolean>(false);
  const [isAwayFromBottom, setIsAwayFromBottom] = useState(false);
  const mainDiv = useRef<HTMLDivElement>(null);
  const chatsDiv = useRef<HTMLDivElement>(null);
  const textareaPlaceholder = useRef<string>('Choose model...');
  let scrollTimoutIsRunning = false;

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
    checkScroll();

    const div = mainDiv.current;
    if (div) {
      div.addEventListener('scroll', checkScroll);
    }

    return () => {
      if (div) {
        div.removeEventListener('scroll', checkScroll);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (modelName != null) {
      setChats((prevArray) => [...prevArray, { content: systemPromptMessage, role: ChatRole.SYSTEM }]);
      textareaPlaceholder.current = 'Ask me anything...';
    }
  }, [modelName]);

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
    delayedScrollToBottom(isDivAwayFromBottom(mainDiv));

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
            delayedScrollToBottom(isDivAwayFromBottom(mainDiv));
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

  const delayedScrollToBottom = (awayFromBottom: boolean) => {
    if (!scrollTimoutIsRunning && !awayFromBottom) {
      scrollTimoutIsRunning = true;
      setTimeout(() => {
        scrollToBottom();
      }, 200);
    }
  };

  const scrollToBottom = () => {
    if (chatsDiv.current != null) {
      chatsDiv.current.lastElementChild?.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest',
      });
      scrollTimoutIsRunning = false;
    }
  };

  const checkScroll = () => {
    const awayFromBottom = isDivAwayFromBottom(mainDiv);
    setIsAwayFromBottom(awayFromBottom);
  };

  const isDivAwayFromBottom = (ref: RefObject<HTMLDivElement>): boolean => {
    if (!ref.current) return false;
    const bufferHeight = 80;

    const { scrollTop, scrollHeight, clientHeight } = ref.current;
    return Math.ceil(scrollTop + clientHeight) < scrollHeight - bufferHeight;
  };

  const renderModelListVariant = () => {
    if (modelName == null) {
      switch (modelVariant) {
        case 'manual':
          return (
            <Input
              placeholder="Modelname"
              className='w-80 mt-2'
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
            <span className="flex items-center pt-2">
              <h4 className="text-xl font-semibold">Configure settings to begin chat</h4>
              <ArrowUpIcon className="ml-2" />
            </span>
          );
      }
    }
    return <></>;
  };

  return (
    <>
      <main className="flex-1 overflow-y-auto space-y-4" ref={mainDiv}>
        {modelsIsError && <AlertBox title="Error" description={modelsError.message} />}

        {renderModelListVariant()}

        {modelName != null && (
          <section className="space-y-4 w-full mt-3" ref={chatsDiv}>
            {chats.length === 1 ? (
              <h2 className="mt-10 scroll-m-20 text-center pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
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

        {isAwayFromBottom && <PageDownButton onClick={scrollToBottom} className="absolute bottom-24 left-1/2" />}
      </main>

      <section className="py-3 relative">
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
