import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChatBubble } from "@/components/chat-bubble";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ModelMenu } from "@/components/model-menu";

type ChatMessage = {
  human: boolean;
  message: string;
}

const chat: ChatMessage[] = [
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
  return (
    <>
      <main className="bg-background container">
        <div className="pt-4">
          <ModelMenu />
        </div>
        <div className="py-5 pt-4">
          <div className="space-y-4">
            {chat.map((message, index) => (
              <ChatBubble human={message.human} message={message.message} key={index} />
            ))}
            {/* 
            <div className="flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm bg-muted">Hi, how can I help you today?</div>
            <div className="flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm ml-auto bg-primary text-primary-foreground">Hey, Im having trouble with my account.</div>
            <div className="flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm bg-muted">What seems to be the problem?</div>
            <div className="flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm ml-auto bg-primary text-primary-foreground">I cant log in.</div>
            */}
          </div>
        </div>

        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input type="email" placeholder="Type your message..." />
          <Button type="submit">Send</Button>
        </div>

      </main>
    </>
  );
}
