"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChatBubble } from "@/components/chat-bubble";
import { ModelMenu } from "@/components/model-menu";
import { useState, useRef, useEffect } from "react";
import { ChatMessage, ChatRole, OllamaTag, OllamaTagSchema } from "@/lib/types";
import { Spinner } from "@/components/spinner";
import { useOllamaStore } from "../lib/store";
import hljs from 'highlight.js';

const systemMessage = "Hello i am a AI assistant, how can i help you?";
const keepAlive = "10m";
// Hello my name is Miguel! What can you help me with? answer in 2 sentences

export default function Home() {
  const { model } = useOllamaStore();
  const [chat, setChat] = useState<string>("");
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [working, setWorking] = useState<boolean>(false);
  const [tag, setTag] = useState<OllamaTag>({ models: [] });
  const chatsListDiv = useRef<HTMLDivElement>(null);
  let scrollTimoutIsRunning = false;

  useEffect(() => {
    loadModels();
  }, []);

  useEffect(() => {
    if (model != null) {
      setChats((prevArray) => [
        ...prevArray,
        { content: `You are talking to ${model}`, role: ChatRole.ASSISTANT },
      ]);

      setChats((prevArray) => [
        ...prevArray,
        { content: systemMessage, role: ChatRole.SYSTEM },
      ]);
    }
  }, [model]);

  const loadModels = async () => {
    const url = `http://localhost:11434/api/tags`;
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const data: unknown = await response.json();
    const validatedOllamaTag = await OllamaTagSchema.safeParseAsync(data);
    if (!validatedOllamaTag.success) {
      console.error(validatedOllamaTag.error);
      return;
    }
    setTag(validatedOllamaTag.data);
  };

  const chatStream = async (message: ChatMessage) => {
    setLoading(true);
    delayedScrollToBottom();

    const payload = {
      model: model,
      messages: [...chats, message],
      stream: true,
    };

    const url = `http://localhost:11434/api/chat`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (response.status !== 200) {
      console.error(
        new Error(`API request failed with status code: ${response.status}:`)
      );
      return;
    }

    if (response.body == null) {
      console.error(new Error(`API request failed with empty response body`));
      return;
    }

    let assistantChatMessage = "";
    const decoder = new TextDecoder();
    const reader = response.body.getReader();

    setChats((prevArray) => [
      ...prevArray,
      { content: assistantChatMessage, role: ChatRole.ASSISTANT },
    ]);

    let checkFirstCharSpacing = true;
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        setChats((prevArray) => {
          return prevArray.map((chat, index) => {
            if (index === prevArray.length - 1) {
              // Remove eventual ending linebreaks and spaces
              chat.content = chat.content.replace(/[\n\s]+$/, "");
            }
            return chat;
          });
        });
        break;
      }

      const decodedChunk = decoder.decode(value, { stream: true });
      const chunkList = parseJson(decodedChunk);
      if (chunkList != null && chunkList.length > 0) {
        for (const chunkObj of chunkList) {
          if (chunkObj == null) {
            continue;
          }

          let chunkContent = chunkObj.message.content;
          if (checkFirstCharSpacing && /\S/.test(chunkContent)) {
            // Remove eventual initial linebreaks and spaces
            assistantChatMessage = "";
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

  const parseJson = (json: string): any[] => {
    try {
      if (json.includes("}\n")) {
        // Handle cases where stream returns two or more json object strings
        const jsonStrings = json.split("}\n");
        return jsonStrings.map((str) => {
          if (str.length > 0) {
            return JSON.parse(`${str}}`);
          } else {
            return null;
          }
        });
      }
      return [JSON.parse(json)];
    } catch (error) {
      console.error(`${error}. Failed to parse JSON: ${json}`);
      return [];
    }
  };

  const delayHL = () => {
    setTimeout(() => {
      setHighlighter();
    }, 300);
  }

  const setHighlighter = () => {
    const elements = document.querySelectorAll(`[class^="language-"]`);
    const codeBlocks = Array.from(elements) as HTMLElement[];
    if (codeBlocks) {
      codeBlocks.forEach((codeBlock) => {
        hljs.highlightElement(codeBlock);
      });
    }
  }

  const sendChat = async () => {
    setWorking(true);
    const chatMessage = { content: chat, role: ChatRole.USER };
    setChats((prevArray) => [...prevArray, chatMessage]);
    setChat("");
    await chatStream(chatMessage);
    setWorking(false);
    delayHL();
  };

  const chatEnterPress = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !working && model != null) {
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
    if (chatsListDiv.current != null) {
      chatsListDiv.current.lastElementChild?.scrollIntoView({
        behavior: "smooth",
        block: "end",
        inline: "nearest",
      });
      scrollTimoutIsRunning = false;
    }
  };

  return (
    <>
      <main className="flex-1 overflow-y-auto">
        <div className="py-3">
          {model === null && <ModelMenu models={tag.models} />}
        </div>
        {model != null && (
          <div className="space-y-4 w-full" ref={chatsListDiv}>
            {chats.map((message, index) => (
              <ChatBubble
                role={message.role}
                content={message.content}
                key={index}
              />
            ))}
          </div>
        )}
        {loading && (
          <div className="mt-2">
            <Spinner />
          </div>
        )}
      </main>

      <footer className="w-full bg-background py-3">
        <div className="w-full relative">
          <Textarea
            value={chat}
            onChange={(e) => setChat(e.target.value)}
            onKeyUp={chatEnterPress}
            placeholder="Type your message..."
            className="overflow-hidden pr-20"
            disabled={model === null}
          />
          <Button
            onClick={sendChat}
            className="absolute bottom-3 right-3"
            disabled={working || model === null}
          >
            Send
          </Button>
        </div>
      </footer>
    </>
  );
}
