'use client';

import * as React from 'react';
import {
  ChatRole,
  type TContentText,
  type TContentUnion,
  type TCustomChatMessage,
  type TCustomCreateImageData,
  type TCustomMessage,
} from '@/lib/types';
import Markdown, { type ExtraProps } from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { UserIcon, BrainIcon, ChevronRightIcon, ChevronDownIcon, CopyIcon } from 'lucide-react';
import { type FC, type ReactNode, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import Image from 'next/image';
import { visit } from 'unist-util-visit';
import { Spinner } from './spinner';
import { v7 as uuidv7 } from 'uuid';

type ChatMessagesProps = {
  message: TCustomMessage;
  role: ChatRole;
};

const thinkPlugin = (messageId: string) => {
  return (tree: any) => {
    visit(tree, (node) => {
      if (node.type === 'html' && node.value.includes('<think>')) {
        const thinkId = `think-${messageId}`;

        node.value = `<div>
        <span data-think-id="${thinkId}">Thinking</span>
        <div class="text-stone-300 bg-stone-950 rounded p-3 mb-2 hidden" id="${thinkId}">`;
      }

      if (node.type === 'html' && node.value.includes('</think>')) {
        node.value = `</div></div>`;
      }
    });
  };
};

export const ChatMessages: React.FC<ChatMessagesProps> = ({ message, role }) => {
  const messageId = uuidv7();

  useEffect(() => {
    if (!message.isReasoning) {
      const loaderThinkingId = `loader-think-${messageId}`;
      const loader = document.getElementById(loaderThinkingId);
      if (loader?.classList.contains('hidden') === false) {
        loader.classList.add('hidden');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message, message.isReasoning]);

  const isImage = (item: TCustomChatMessage | TCustomCreateImageData): item is TCustomCreateImageData => {
    return (item as TCustomCreateImageData).url !== undefined || (item as TCustomCreateImageData).b64_json !== undefined;
  };

  const isChat = (item: TCustomChatMessage | TCustomCreateImageData): item is TCustomChatMessage => {
    return (item as TCustomChatMessage).content !== undefined;
  };

  const renderContent = (content: TContentUnion) => {
    if (content && Array.isArray(content) && content.length > 0) {
      return (content[0] as TContentText).text;
    } else if (typeof content === 'string') {
      return content;
    }
    return '';
  };

  const renderAttachments = (content: TContentUnion) => {
    if (content && Array.isArray(content) && content.length > 0) {
      const images = content.filter((item) => item.type === 'image_url');

      const fileAttachments = images.map((image, i) => {
        return (
          <div key={i} className="rounded-lg bg-stone-800 p-3">
            <Image src={image.image_url.url} width={100} height={100} alt={`Attachment: ${image.meta?.filename}`} />
            <span className="pt-2">{image.meta?.filename}</span>
          </div>
        );
      });

      return <div className="flex flex-wrap gap-2 pt-3">{fileAttachments}</div>;
    }
    return '';
  };

  const render = () => {
    if (isChat(message)) {
      return (
        <>
          <Markdown components={components} rehypePlugins={[rehypeRaw]} remarkPlugins={[() => thinkPlugin(messageId)]}>
            {renderContent(message.content)}
          </Markdown>
          {renderAttachments(message.content)}
        </>
      );
    } else if (isImage(message)) {
      return (
        <>
          {message.url != null ? (
            <>
              <Image src={message.url ?? ''} width={500} height={500} alt="AI generated" className="pt-2" />
              <span className="text-muted-foreground text-xs">
                <a href={message.url} target="_blank" className="underline">
                  Original
                </a>{' '}
                (only valid 1 hour)
              </span>
            </>
          ) : (
            <>
              <Image
                src={`data:image/png;base64,${message.b64_json}`}
                width={500}
                height={500}
                alt="AI generated"
                className="pt-2"
              />
              <span className="text-muted-foreground text-xs">
                <a
                  href={`data:image/png;base64,${message.b64_json}`}
                  download="ai-generated-image.png"
                  target="_blank"
                  className="underline"
                >
                  Download Image
                </a>
              </span>
            </>
          )}
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
            <UserIcon className="mr-2 h-6 w-6 self-start" />
          ) : (
            <BrainIcon className="mr-2 h-6 w-6 self-start" />
          )}
          <div
            className={`flex w-full max-w-full flex-col overflow-x-hidden rounded-md px-3 py-1 text-sm leading-6 text-wrap ${
              role == ChatRole.USER ? 'bg-stone-700 whitespace-pre-wrap' : 'bg-stone-900'
            }`}
          >
            <div id={messageId}>{render()}</div>
            <div className="flex items-center gap-2">
              {isChat(message) && (
                <span className="text-muted-foreground my-1 text-xs">
                  <button
                    className="rounded-xs p-1 hover:bg-stone-950"
                    title="Copy"
                    onClick={() => copyToClipboard(messageId)}
                  >
                    <CopyIcon className="h-4 w-4" />
                  </button>
                </span>
              )}
              {role == ChatRole.ASSISTANT && (
                <>
                  <span className="pr-1 text-stone-700">|</span>
                  <span>{!message.streamComplete && !message.isReasoning && <Spinner />}</span>
                  <span className="text-xs">
                    Answered by: <strong>{message.provider.model}</strong>, {message.provider.provider}
                  </span>
                </>
              )}
            </div>
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
    <div className="border-secondary flex w-full rounded-b-lg border bg-[#0d1117] p-3 text-wrap">
      <code {...rest} className={`${className} `}>
        {children}
      </code>
    </div>
  ) : (
    <code {...rest} className={`language-javascript border-secondary border bg-[#0d1117] p-1`}>
      {children}
    </code>
  );
};

const getChildClass = (children: ReactNode): string => {
  if (React.isValidElement(children)) {
    return (children as React.ReactElement<any>).props.className;
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
  const title = match ? (match[1] ?? '') : '';
  const codeId = uuidv7();
  return (
    <>
      <CodeHeader title={title} codeId={codeId} />
      <pre id={codeId} {...rest} className={`mb-3`}>
        {children}
      </pre>
    </>
  );
};

const Span = ({ node, className, children, ...props }: React.ComponentProps<'span'> & ExtraProps) => {
  const thinkId = String(node?.properties?.dataThinkId ?? '');
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  const handleClick = () => {
    const element = document.getElementById(thinkId);
    if (element) {
      element.classList.toggle('hidden');
      setIsVisible((prevIsVisible) => !prevIsVisible);
    }
  };

  return thinkId ? (
    <button
      {...props}
      className={`${className} mt-1 mb-3 flex cursor-pointer items-center gap-1`}
      onClick={handleClick}
      type="button"
      ref={elementRef as React.RefObject<HTMLButtonElement>}
    >
      <span id={`loader-${thinkId}`} className="">
        <Spinner />
      </span>
      <span className="text-sm">{children}</span>
      {isVisible ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
    </button>
  ) : (
    <span {...props}>{children}</span>
  );
};

const components = {
  code: Code,
  pre: Pre,
  span: Span,
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
