"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChatBubble } from "@/components/chat-bubble";
import { ModelMenu } from "@/components/model-menu";
import { useState } from 'react';

type ChatMessage = {
  human: boolean;
  message: string;
}

const chatsMock: ChatMessage[] = [
  {
    human: false,
    message: "Hi, how can I help you today?",
  },
  {
    human: true,
    message: "Hey, Im having trouble with my account.",
  },
  {
    human: false,
    message: "What seems to be the problem?",
  },
  {
    human: true,
    message: "I cant log in.",
  },
];

export default function Home() {
  const [chat, setChat] = useState<string>('');
  const [chats, setChats] = useState<ChatMessage[]>([]);

  const handleSend = () => {
    setChats([
      ...chats,
      { message: chat, human: true }
    ]);
    setChat('');
  }

  return (
    <>
      <main className="bg-background container">
        <div className="pt-4">
          <ModelMenu />
        </div>
        <div className="py-5 pt-4">
          <div className="space-y-4">
            {chats.map((message, index) => (
              <ChatBubble human={message.human} message={message.message} key={index} />
            ))}
          </div>
        </div>

        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input type="text" value={chat} onChange={e => setChat(e.target.value)} placeholder="Type your message..." />
          <Button onClick={handleSend}>Send</Button>
        </div>

      </main>
    </>
  );
}
