"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ChatBubble } from "@/components/chat-bubble";
import { ModelMenu } from "@/components/model-menu";
import { useState, useRef } from 'react';
import { ChatMessage, ChatRole } from "@/lib/types";

export default function Home() {
  const [chat, setChat] = useState<string>('');
  const [chats, setChats] = useState<ChatMessage[]>([{ content: 'Hello i am a bot assistant.', role: ChatRole.SYSTEM}]);
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const getChat = async (message: ChatMessage): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      const payload = {
        "model": 'mistral',
        "messages": [...chats, message],
        "stream": false,
      };

      console.log(payload);

      const url = `http://localhost:11434/api/chat`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.status === 200) {
        const r = await response.json();
        resolve(r.message.content.trim());
      } else {
        reject(new Error(`API request failed with status code: ${response.status}:`));
      }
    });
  }

  const sendChat = async () => {
    const chatMessage = { content: chat, role: ChatRole.USER };
    setChats(prevArray => [...prevArray, chatMessage]);
    setChat('');

    const response = await getChat(chatMessage);
    setChats(prevArray => [...prevArray, { content: response, role: ChatRole.ASSISTANT }]);

    scrollToBottom();
  }

  const chatEnterPress = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      await sendChat();
    }
  }

  return (
    <>
      <main className="flex-1 overflow-y-auto">
        <div className="py-3">
          <ModelMenu />
        </div>
        <div className="space-y-4">
          {chats.map((message, index) => (
            <ChatBubble role={message.role} content={message.content} key={index} />
          ))}
        </div>
        <div ref={messagesEndRef} />
      </main>

      <footer className="w-full bg-background py-3">
        <div className="w-full relative">
          <Textarea
            value={chat}
            onChange={e => setChat(e.target.value)}
            onKeyUp={chatEnterPress}
            placeholder="Type your message..."
            className="overflow-hidden" />
          <Button onClick={sendChat} className="absolute bottom-3 right-3">Send</Button>
        </div>
      </footer>
    </>
  );
}
