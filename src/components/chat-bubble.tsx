"use client";

import * as React from "react";
import { ChatMessage, ChatRole } from "@/lib/types";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { coldarkDark } from "react-syntax-highlighter/dist/esm/styles/prism";

export const ChatBubble: React.FC<ChatMessage> = ({ role, content }) => {
  return (
    <pre
      className={`flex max-w-[100%] w-full flex-col gap-2 rounded-lg px-3 py-2 text-wrap text-sm font-sans ${
        role == ChatRole.USER
          ? "whitespace-pre-wrap text-white-foreground bg-slate-800"
          : "bg-zinc-950"
      }`}
    >
      <ReactMarkdown
        components={{
          code(props) {
            const { children, className, node, ...rest } = props;
            const match = /language-(\w+)/.exec(className || "");
            return match ? (
              <SyntaxHighlighter
                {...rest}
                PreTag="div"
                language={match[1] == "" ? "plaintext" : match[1]}
                style={coldarkDark}
                ref={null}
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            ) : (
              <code
                {...rest}
                className={`${className} bg-slate-900 language-html`}
              >
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </pre>
  );
};
