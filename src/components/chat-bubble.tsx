"use client";

import * as React from "react";
import { ChatMessage, ChatRole } from "@/lib/types";
import Markdown from "react-markdown";

export const ChatBubble: React.FC<ChatMessage> = ({ role, content }) => {
  return (
    <pre
      className={`flex max-w-[100%] w-full flex-col gap-2 rounded-lg px-3 py-2 text-wrap text-sm font-sans ${
        role == ChatRole.USER
          ? "whitespace-pre-wrap bg-emerald-900"
          : "bg-gray-900"
      }`}
    >
      <Markdown
        className={`${role == ChatRole.USER ? "" : ""}`}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            const code = children;
            return !inline && match ? (
              <code className={`${className} ${match[1]} p-3 flex border border-secondary bg-gray-950`} {...props}>
                {code}
              </code>
            ) : (
              <code className={className ? className : ""} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </Markdown>
    </pre>
  );
};
