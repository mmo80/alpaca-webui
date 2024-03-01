'use client';

import * as React from 'react';
import { ChatMessage, ChatRole } from '@/lib/types';
import Markdown, { ExtraProps } from 'react-markdown';
import { PersonIcon, LayersIcon } from '@radix-ui/react-icons';

export const ChatBubble: React.FC<ChatMessage> = ({ role, content }) => {
  return (
    <>
      {role != ChatRole.SYSTEM && (
        <section className="flex items-end">
          {role == ChatRole.USER ? <PersonIcon className="mr-2 self-start w-6 h-6" /> : <LayersIcon className="mr-2 self-start w-6 h-6" />}
          <div
            className={`flex max-w-[100%] w-full flex-col gap-2 text-wrap text-sm leading-7 font-sans overflow-x-hidden rounded-md py-1 px-3 ${
              role == ChatRole.USER ? 'whitespace-pre-wrap bg-stone-700' : 'bg-stone-900'
            }`}
          >
            <Markdown components={components}>{content}</Markdown>
          </div>
        </section>
      )}
    </>
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
      <div className="flex justify-between items-center p-1 rounded-t-lg bg-stone-800">
        <span className="text-stone-400 ml-2">{match[1]}</span>
        <button
          className="code bg-stone-700 hover:bg-stone-600 text-gray-300 px-3 py-0 rounded-md"
          onClick={() => copyToClipboard(codeId)}
        >
          Copy
        </button>
      </div>
      <code id={codeId} {...rest} className={`${className} p-3 flex border border-secondary rounded-b-lg bg-stone-950`}>
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
