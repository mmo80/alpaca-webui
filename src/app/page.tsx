"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ChatBubble } from "@/components/chat-bubble";
import { ModelMenu } from "@/components/model-menu";
import { useState } from 'react';

type ChatMessage = {
  human: boolean;
  message: string;
}

export default function Home() {
  const [chat, setChat] = useState<string>('');
  const [chats, setChats] = useState<ChatMessage[]>([]);

  const sendChat = async () => {
    setChats([...chats, { message: chat, human: true }]);
    setChat('');
  }

  const chatEnterPress = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      await sendChat();
    }
  }

  return (
    <>
      <main className="min-h-screen">

        <div className="overflow-hidden">
          <div className="">
            <ModelMenu />
          </div>
          <div className="space-y-4">
            {chats.map((message, index) => (
              <ChatBubble human={message.human} message={message.message} key={index} />
            ))}
          </div>
        </div>

      </main>
      <footer className="sticky bottom-0 bg-background py-3">
        <div className="w-full relative">

          <Textarea
            value={chat}
            onChange={e => setChat(e.target.value)}
            onKeyDown={chatEnterPress}
            placeholder="Type your message..."
            className="overflow-hidden" />
          <Button onClick={sendChat} className="absolute bottom-3 right-3">Send</Button>
        </div>
      </footer>
    </>
  );
}
