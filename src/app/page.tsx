'use client';

import { useState, useRef, useEffect, RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChatBubble } from '@/components/chat-bubble';
import { ModelMenu } from '@/components/model-menu';
import { Spinner } from '@/components/spinner';
import { PageDownButton } from '@/components/page-down-button';

import { useQuery } from '@tanstack/react-query';
import { ChatMessage, ChatRole } from '@/lib/types';
import { useModelStore } from '../lib/store';
import { api } from '../lib/api';
import { AlertBox } from '@/components/alert-box';
import { delayHighlighter, parseJsonStream } from '@/lib/utils';
import useLocalStorage from '@/lib/local-storage';

const systemPromptMessage = 'Hello i am a AI assistant, how can i help you?';

export default function Home() {
  const { modelName, updateModel } = useModelStore();
  const [chat, setChat] = useState<string>('');
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [working, setWorking] = useState<boolean>(false);
  const [isAwayFromBottom, setIsAwayFromBottom] = useState(false);
  const [baseUrl, setBaseUrl] = useLocalStorage<string>('ollamaBaseUrl', 'http://localhost:11434');
  const [apiToken, setApiToken] = useState<string>('');
  const mainDiv = useRef<HTMLDivElement>(null);
  const chatsDiv = useRef<HTMLDivElement>(null);
  const textareaPlaceholder = useRef<string>('Choose model...');
  let scrollTimoutIsRunning = false;

  const {
    isLoading: tagIsLoading,
    error: tagError,
    data: tag,
    isSuccess: tagIsSuccess,
    isError: tagIsError,
  } = useQuery({
    queryKey: ['ollamaTag'],
    queryFn: async () => await api.getTag(),
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
    api.setOllamaBaseUrl(baseUrl.toString());
  }, [baseUrl]);

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

      if (tag != null) {
        const model = tag.models.find((model) => model.name === modelName);
        if (model != null) {
          updateModel(model);
        }
      }

      textareaPlaceholder.current = 'Type your message...';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const streamReader = await api.getChatStream(modelName, [...chats, message], apiToken);
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

            //let chunkContent = chunkObj.message.content;
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
        }
      } else {
        console.error(error);
      }
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

  return (
    <>
      <main className="flex-1 overflow-y-auto space-y-4" ref={mainDiv}>
        {tagIsError && <AlertBox title="Error" description={tagError.message} />}
        {modelName == null && (
          <div className="flex">
            <ModelMenu models={tag?.models || []} disabled={!tagIsSuccess} className="py-3" />
            {tagIsLoading && (
              <span className="ml-2">
                <Spinner />
              </span>
            )}
          </div>
        )}

        {modelName != null && (
          <section className="space-y-4 w-full" ref={chatsDiv}>
            {chats.map((message, index) => (
              <ChatBubble role={message.role} content={message.content} key={index} />
            ))}
            {loading && <Spinner />}
          </section>
        )}

        {isAwayFromBottom && (
          <PageDownButton onClick={scrollToBottom} className="absolute bottom-24 left-1/2" />
        )}
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
          <Button
            onClick={sendChat}
            className="absolute bottom-6 right-3"
            disabled={working || modelName === null}
          >
            Send
          </Button>
        )}
      </section>
    </>
  );
}
