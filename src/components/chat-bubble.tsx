"use client";

import * as React from "react";
import { ChatMessage, ChatRole } from "@/lib/types";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { materialDark } from "react-syntax-highlighter/dist/esm/styles/prism";

export const ChatBubble: React.FC<ChatMessage> = ({ role, content }) => {
    return (
        <pre
            className={`flex w-max max-w-[100%] flex-col gap-2 rounded-lg px-3 py-2 text-wrap text-sm font-sans ${
                role == ChatRole.USER
                    ? "whitespace-pre-wrap bg-gradient-to-r from-green-400 to-blue-500 text-primary-foreground"
                    : "bg-background"
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
                                language={match[1]}
                                style={materialDark}
                                ref={React.createRef<SyntaxHighlighter>()}
                            >
                                {String(children).replace(/\n$/, "")}
                            </SyntaxHighlighter>
                        ) : (
                            <code {...rest} className={className}>
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
