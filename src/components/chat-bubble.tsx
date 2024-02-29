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
        <Markdown components={components}>{content}</Markdown>
      </div>
    </section>
  );
};

const Code = ({
  node,
  className,
  children,
  ...rest
}: React.ClassAttributes<HTMLElement> & React.HTMLAttributes<HTMLElement> & ExtraProps) => {
  const match = /language-(\w+)/.exec(className ?? '');
  className = className?.replace('react', '');
  className = className?.replace('+', '');
  const codeId = generateGUID();
  return match ? (
    <>
      <div className="flex justify-between items-center p-1 rounded-t-lg bg-slate-800">
        <span className="text-gray-400 ml-2">{match[1]}</span>
        <button
          className="code bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1 rounded-md"
          onClick={() => copyToClipboard(codeId)}
        >
          Copy
        </button>
      </div>
      <code id={codeId} {...rest} className={`${className} p-3 flex border border-secondary rounded-b-lg bg-gray-950`}>
        {children}
      </code>
    </>
  ) : (
    <code {...rest} className={`language-js p-1 border border-secondary bg-gray-950`}>
      {children}
    </code>
  );
};

const components = {
  code: Code,
};

const copyToClipboard = async (elementId: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.warn('Element not found');
    return;
  }

  const text = element.innerText;

  try {
    await navigator.clipboard.writeText(text);
    console.log('Text copied to clipboard');
  } catch (err) {
    console.error('Failed to copy text to clipboard', err);
  }
};

const generateGUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
