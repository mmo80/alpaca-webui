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
          {role == ChatRole.USER ? (
            <PersonIcon className="mr-2 h-6 w-6 self-start" />
          ) : (
            <LayersIcon className="mr-2 h-6 w-6 self-start" />
          )}
          <div
            className={`flex w-full max-w-[100%] flex-col gap-2 overflow-x-hidden text-wrap rounded-md px-3 py-1 font-sans text-sm leading-7 ${
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
      <div className="flex items-center justify-between rounded-t-lg bg-stone-800 p-1">
        <span className="ml-2 text-stone-400">{match[1]}</span>
        <button
          className="code rounded-md bg-stone-700 px-3 py-0 text-gray-300 hover:bg-stone-600"
          onClick={() => copyToClipboard(codeId)}
        >
          Copy
        </button>
      </div>
      <code id={codeId} {...rest} className={`${className} flex rounded-b-lg border border-secondary bg-stone-950 p-3`}>
        {children}
      </code>
    </>
  ) : (
    <code {...rest} className={`language-js border border-secondary bg-gray-950 p-1`}>
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
