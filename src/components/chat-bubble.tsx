"use client"

import * as React from "react"
import { ChatMessage, ChatRole } from "@/lib/types";

export const ChatBubble: React.FC<ChatMessage> = ({ role, content }) => {
    return (
        <pre className={`flex w-max max-w-[100%] flex-col gap-2 rounded-lg px-3 py-2 text-wrap text-sm ${role == ChatRole.USER ? 'whitespace-pre-wrap bg-primary text-primary-foreground' : 'bg-zinc-900'}`}>
            {content}
        </pre>
    );
}