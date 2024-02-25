'use client';

import { useState, useRef, useEffect } from 'react';
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
// Hello my name is Miguel! What can you help me with? answer in 2 sentences

export default function Home() {
  const { modelName, updateModel } = useModelStore();
  const [chat, setChat] = useState<string>('');
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [working, setWorking] = useState<boolean>(false);
  const [isAwayFromBottom, setIsAwayFromBottom] = useState(false);
  const [baseUrl, setBaseUrl] = useLocalStorage<string>('ollamaBaseUrl', 'http://localhost:11434');
  const chatsDiv = useRef<HTMLDivElement>(null);
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
    api.setOllamaBaseUrl(baseUrl.toString());
  }, [baseUrl]);

  useEffect(() => {
    checkScroll();

    const div = chatsDiv.current;
    if (div) {
      div.addEventListener('scroll', checkScroll);
    }

    return () => {
      if (div) {
        div.removeEventListener('scroll', checkScroll);
      }
    };
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

      if (tag != null) {
        const model = tag.models.find((model) => model.name === modelName);
        if (model != null) {
          updateModel(model);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelName]);

  const chatStream = async (message: ChatMessage) => {
    setLoading(true);
    delayedScrollToBottom();

    if (modelName == null) {
      return;
    }

    const streamReader = await api.getChatStream(modelName, [...chats, message]);

    setLoading(false);

    let assistantChatMessage = '';
    const decoder = new TextDecoder();

    setChats((prevArray) => [...prevArray, { content: assistantChatMessage, role: ChatRole.ASSISTANT }]);

    let checkFirstCharSpacing = true;
    while (true) {
      const { done, value } = await streamReader.read();

      if (done) {
        setChats((prevArray) => {
          return prevArray.map((chat, index) => {
            if (index === prevArray.length - 1) {
              // Remove eventual ending linebreaks and spaces
              chat.content = chat.content.replace(/[\n\s]+$/, '');
            }
            return chat;
          });
        });
        break;
      }

      const decodedChunk = decoder.decode(value, { stream: true });
      const chunkList = parseJsonStream(decodedChunk);
      if (chunkList != null && chunkList.length > 0) {
        for (const chunkObj of chunkList) {
          if (chunkObj == null) {
            continue;
          }

          let chunkContent = chunkObj.message.content;
          if (checkFirstCharSpacing && /\S/.test(chunkContent)) {
            // Remove eventual initial linebreaks and spaces
            assistantChatMessage = '';
            chunkContent = chunkContent.trimStart();
            checkFirstCharSpacing = false;
          }

          assistantChatMessage += chunkContent;

          setChats((prevArray) => {
            return prevArray.map((chat, index) => {
              if (index === prevArray.length - 1) {
                chat.content = assistantChatMessage;
              }
              return chat;
            });
          });

          delayedScrollToBottom();
        }
      }
    }
  };

  const sendChat = async () => {
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

  const delayedScrollToBottom = () => {
    if (!scrollTimoutIsRunning) {
      scrollTimoutIsRunning = true;
      setTimeout(() => {
        scrollToBottom();
      }, 300);
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
    if (!chatsDiv.current) return;
    const bufferHeight = 100;

    const { scrollTop, scrollHeight, clientHeight } = chatsDiv.current;
    const awayFromBottom = Math.ceil(scrollTop + clientHeight) < (scrollHeight- bufferHeight);

    setIsAwayFromBottom(awayFromBottom);
  };

  return (
    <>
      <main className="flex-1 overflow-y-auto space-y-4" ref={chatsDiv}>
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
          <section className="space-y-4 w-full">
            {chats.map((message, index) => (
              <ChatBubble role={message.role} content={message.content} key={index} />
            ))}
            {loading && <Spinner />}
          </section>
        )}

        {isAwayFromBottom && <PageDownButton className="absolute bottom-24 left-1/2" />}
      </main>

      <section className="py-3 relative">
        {/* <div>{isAwayFromBottom ? 'Scroll is away from bottom' : 'Scroll is at the bottom'}</div> */}
        <Textarea
          value={chat}
          onChange={(e) => setChat(e.target.value)}
          onKeyUp={chatEnterPress}
          placeholder="Type your message..."
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
