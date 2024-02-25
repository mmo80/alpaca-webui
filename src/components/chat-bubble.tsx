'use client';

import * as React from 'react';
import { ChatMessage, ChatRole } from '@/lib/types';
import Markdown, { ExtraProps } from 'react-markdown';
import { PersonIcon, LayersIcon } from '@radix-ui/react-icons';

export const ChatBubble: React.FC<ChatMessage> = ({ role, content }) => {
  return (
    <section className="flex">
      {role == ChatRole.USER ? (
        <PersonIcon className="mr-2 mt-2 w-6 h-6" />
      ) : (
        <LayersIcon className="mr-2 mt-2 w-6 h-6" />
      )}
      <div
        className={`flex max-w-[100%] w-full flex-col gap-2 rounded-lg px-3 py-2 text-wrap text-sm font-sans overflow-x-hidden ${
          role == ChatRole.USER ? 'whitespace-pre-wrap bg-emerald-900' : 'bg-gray-900'
        }`}
      >
        <Markdown components={components}>
          {content}
        </Markdown>
      </div>
    </section>
  );
};

const Code = ({ node, className, children, ...rest }: React.ClassAttributes<HTMLElement> & React.HTMLAttributes<HTMLElement> & ExtraProps) => {
  const match = /language-(\w+)/.exec(className || '');
  return match ? (
    <code {...rest} className={`${className} p-3 flex border border-secondary bg-gray-950`}>
      {children}
    </code>
  ) : (
    <code {...rest} className={`language-js p-1 border border-secondary bg-gray-950`}>
      {children}
    </code>
  );
}

const components = {
  code: Code
}
