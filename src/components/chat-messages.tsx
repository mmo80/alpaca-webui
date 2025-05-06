'use client';

import * as React from 'react';
import { ChatRole, isChat, isImage, type TChatMessage, type TContentText, type TCustomMessage } from '@/lib/types';
import Markdown, { type ExtraProps } from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { UserIcon, BrainIcon, ChevronRightIcon, ChevronDownIcon, CopyIcon, AlertCircle } from 'lucide-react';
import { type FC, type ReactNode, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import Image from 'next/image';
import { Spinner } from './spinner';
import { v7 as uuidv7 } from 'uuid';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatTime, thinkPlugin } from '@/lib/utils';
import { ChatContext } from './chat-context';
import { useDocumentsQuery } from '@/trpc/queries';

export const ChatMessages: React.FC<{ message: TCustomMessage; role: ChatRole }> = ({ message, role }) => {
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

  const content = () => {
    const content = (message as TChatMessage).content;
    if (content && Array.isArray(content) && content.length > 0) {
      return (content[0] as TContentText).text;
    } else if (typeof content === 'string') {
      return content;
    }
    return '';
  };

  const cancellation = () => {
    if (!message.cancelled) return;

    return (
      <Alert variant="destructive" className="my-3 flex items-end gap-2">
        <span>
          <AlertCircle className="h-4 w-4" />
        </span>
        <AlertDescription>Cancelled by user</AlertDescription>
      </Alert>
    );
  };

  const attachments = () => {
    const content = (message as TChatMessage).content;
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

  const chat = () => {
    if (isChat(message)) {
      return (
        <>
          <Markdown components={components} rehypePlugins={[rehypeRaw]} remarkPlugins={[() => thinkPlugin(messageId)]}>
            {content()}
          </Markdown>
          {attachments()}
          {cancellation()}
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
          {cancellation()}
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
            <div id={messageId}>{chat()}</div>
            <MessageFooter messageId={messageId} message={message} role={role} />
          </div>
        </section>
      )}
    </>
  );
};

const MessageFooter: FC<{ messageId: string; message: TCustomMessage; role: ChatRole }> = ({ messageId, message, role }) => {
  const { data: documents, isLoading: isDocumentsLoading } = useDocumentsQuery();

  return (
    <div className="mt-2 flex items-center gap-2">
      {isChat(message) && (
        <span className="text-muted-foreground my-1 text-xs">
          <button className="rounded-xs p-1 hover:bg-stone-950" title="Copy" onClick={() => copyToClipboard(messageId)}>
            <CopyIcon className="h-4 w-4" />
          </button>
        </span>
      )}
      {role == ChatRole.ASSISTANT && (
        <>
          <span className="text-stone-700">|</span>
          {!message.streamComplete && !message.isReasoning && (
            <span>
              <Spinner />
            </span>
          )}
          <span className="text-xs">
            Answered by: <strong>{message.provider.model}</strong>, {message.provider.provider}
          </span>
          <span className="text-stone-700">|</span>
          {message.streamComplete && <span className="text-xs">Duration: {formatTime(message.durationInMs)}</span>}
        </>
      )}
      {message.context && (
        <>
          {isDocumentsLoading ? (
            <span>
              <Spinner />
            </span>
          ) : (
            <ChatContext context={message.context} documents={documents} editable={false} documentPrefix="" />
          )}
        </>
      )}
    </div>
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
