'use client';

import { useState, useRef, useEffect, RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
import { EditSettings } from '@/components/edit-settings';

const systemPromptMessage = 'Hello i am a AI assistant, how can i help you?';

export default function Home() {
  const { modelName } = useModelStore();
  const { modelVariant, hostname, token } = useSettingsStore();
  const [chat, setChat] = useState<string>('');
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
      setChats((prevArray) => [
        ...prevArray,
        {
          content: `You are talking to **${modelName}**`,
          role: ChatRole.ASSISTANT,
        },
      ]);
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

  const sendChat = async () => {
    if (chat === '') {
      return;
    }
    setWorking(true);
    const chatMessage = { content: chat, role: ChatRole.USER };
    setChats((prevArray) => [...prevArray, chatMessage]);
    setChat('');
    await chatStream(chatMessage);
    setWorking(false);
    delayHighlighter();
  };

  const chatEnterPress = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !working && modelName != null) {
      await sendChat();
    }
  };

  const preventEnterPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !working && modelName != null) {
      e.preventDefault();
    }
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
          return <div>INPUT</div>;
        case 'ollama':
        case 'openai':
          return (
            <div className="flex">
              <ModelMenu models={models ?? []} disabled={!modelsIsSuccess} className="py-3" />
              {modelsIsLoading && (
                <span className="ml-2">
                  <Spinner />
                </span>
              )}
            </div>
          );
        default:
          return <p className="text-sm">Edit settings to start chat.</p>;
      }
    }
    return <></>;
  };

  return (
    <>
      <main className="flex-1 overflow-y-auto space-y-4" ref={mainDiv}>
        {modelsIsError && <AlertBox title="Error" description={modelsError.message} />}

        <EditSettings />

        {renderModelListVariant()}

        {modelName != null && (
          <section className="space-y-4 w-full" ref={chatsDiv}>
            {chats.map((message, index) => (
              <ChatBubble role={message.role} content={message.content} key={index} />
            ))}
            {loading && <Spinner />}
          </section>
        )}

        {isAwayFromBottom && <PageDownButton onClick={scrollToBottom} className="absolute bottom-24 left-1/2" />}
      </main>

      <section className="py-3 relative">
        <Textarea
          value={chat}
          onChange={(e) => setChat(e.target.value)}
          onKeyUp={chatEnterPress}
          onKeyDown={preventEnterPress}
          placeholder={textareaPlaceholder.current}
          className="overflow-hidden pr-20"
          disabled={modelName === null}
        />
        {working ? (
          <Button onClick={api.cancelChatStream} className="absolute bottom-6 right-3" disabled={!working}>
            Cancel
          </Button>
        ) : (
          <Button onClick={sendChat} className="absolute bottom-6 right-3" disabled={working || modelName === null}>
            Send
          </Button>
        )}
      </section>
    </>
  );
}
