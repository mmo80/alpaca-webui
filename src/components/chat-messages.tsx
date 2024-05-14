'use client';

import * as React from 'react';
import { ChatRole, TChatMessage, TCreateImageData, TMessage } from '@/lib/types';
import Markdown, { ExtraProps } from 'react-markdown';
import { PersonIcon, LayersIcon, CopyIcon } from '@radix-ui/react-icons';
import { FC, ReactNode } from 'react';
import { toast } from 'sonner';
import Image from 'next/image';

type ChatMessagesProps = {
  message: TMessage;
  role: ChatRole;
};

export const ChatMessages: React.FC<ChatMessagesProps> = ({ message, role }) => {
  const messageId = generateGUID();

  function isImage(item: TChatMessage | TCreateImageData): item is TCreateImageData {
    return (item as TCreateImageData).url !== undefined;
  }

  function isChat(item: TChatMessage | TCreateImageData): item is TChatMessage {
    return (item as TChatMessage).content !== undefined;
  }

  const render = () => {
    if (isChat(message)) {
      return <Markdown components={components}>{message.content}</Markdown>;
    } else if (isImage(message)) {
      return (
        <>
          <Image src={message.url} width={500} height={500} alt="AI generated" className="pt-2" />
          <span className="text-xs text-muted-foreground">
            <a href={message.url} target="_blank" className="underline">
              Original
            </a>{' '}
            (only valid 1 hour)
          </span>
        </>
      );
    }
    return <span>(no data)</span>;
  };

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
            className={`flex w-full max-w-full flex-col overflow-x-hidden text-wrap rounded-md px-3 py-1 font-sans text-sm leading-6 ${
              role == ChatRole.USER ? 'whitespace-pre-wrap bg-stone-700' : 'bg-stone-900'
            }`}
          >
            <div id={messageId}>{render()}</div>
            {isChat(message) && (
              <span className="my-1 text-xs text-muted-foreground">
                <button
                  className="rounded-full p-1 hover:bg-stone-950"
                  title="Copy"
                  onClick={() => copyToClipboard(messageId)}
                >
                  <CopyIcon className="h-4 w-4" />
                </button>
              </span>
            )}
          </div>
        </section>
      )}
    </>
  );
};

const CodeHeader: FC<{ title: string; codeId: string }> = ({ title, codeId }) => {
  return (
    <div className="mt-3 flex items-center justify-between rounded-t-lg bg-stone-800 p-1">
      <span className="ml-2 text-stone-400">{title}</span>
      <button
        className="code rounded-md bg-stone-700 px-3 py-0 text-gray-300 hover:bg-stone-600"
        onClick={() => copyToClipboard(codeId)}
      >
        Copy
      </button>
    </div>
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
  return match ? (
    <code {...rest} className={`${className} flex w-full text-wrap rounded-b-lg border border-secondary bg-stone-950 p-3`}>
      {children}
    </code>
  ) : (
    <code {...rest} className={`language-js border border-secondary bg-gray-950 p-1`}>
      {children}
    </code>
  );
};

const getChildClass = (children: ReactNode): string => {
  if (React.isValidElement(children)) {
    return (children as React.ReactElement).props.className;
  }
  return '-';
};

const Pre = ({
  node,
  className,
  children,
  ...rest
}: React.ClassAttributes<HTMLPreElement> & React.HTMLAttributes<HTMLPreElement> & ExtraProps) => {
  const cssClass = getChildClass(children);
  const match = /language-(\w+)/.exec(cssClass ?? '');
  const title = match ? match[1] : '';
  const codeId = generateGUID();
  return (
    <>
      <CodeHeader title={title} codeId={codeId} />
      <pre id={codeId} {...rest} className={`mb-3`}>
        {children}
      </pre>
    </>
  );
};

const components = {
  code: Code,
  pre: Pre,
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
    toast.info('Copied to clipboard');
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
