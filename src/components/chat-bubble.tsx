"use client"

import * as React from "react"

type ChatBubbleProps = {
    human: boolean;
    message: string;
};

export const ChatBubble: React.FC<ChatBubbleProps> = ({ human, message }) => {
    return (
        <div className={`flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${human ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            {message}
        </div>
    );
}