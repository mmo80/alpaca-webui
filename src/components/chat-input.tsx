import React, { FC, useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { DoubleArrowUpIcon, StopIcon } from '@radix-ui/react-icons';

interface ChatInputProps {
  onSendInput: (input: string) => Promise<void>;
  onCancelStream: () => void;
  chatInputPlaceholder: string;
  isStreamProcessing: boolean;
  isFetchLoading: boolean;
  isLlmModelActive: boolean;
}

export const ChatInput: FC<ChatInputProps> = ({
  onSendInput,
  onCancelStream,
  chatInputPlaceholder,
  isStreamProcessing,
  isFetchLoading,
  isLlmModelActive,
}) => {
  const [chatInput, setChatInput] = useState<string>('');
  const [textareaPlaceholder, setTextareaPlaceholder] = useState<string>('');
  const chatInputDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTextareaPlaceholder(chatInputPlaceholder);
  }, [chatInputPlaceholder]);

  const sendChat = async () => {
    const chatInputTrimmed = chatInput.trim();
    setChatInput('');
    if (chatInputDivRef.current) chatInputDivRef.current.dataset.clonedVal = ' ';
    await onSendInput(chatInputTrimmed);
  };

  const chatEnterPress = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isStreamProcessing && !isFetchLoading && isLlmModelActive) {
      await sendChat();
    }
  };

  const preventEnterPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isStreamProcessing && !isFetchLoading && isLlmModelActive) {
      e.preventDefault();
    }
  };

  const onInputExpand = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    if (chatInputDivRef.current && value.length > 0) {
      const rows = value.split('\n');
      if (rows.length < 8) {
        chatInputDivRef.current.dataset.clonedVal = value;
      }
    }
  };

  return (
    <div className="px-3">
      <div
        ref={chatInputDivRef}
        className="grid
          text-sm
          after:invisible
          after:whitespace-pre-wrap
          after:border
          after:px-3.5
          after:py-2.5
          after:text-inherit
          after:content-[attr(data-cloned-val)_'_']
          after:[grid-area:1/1/2/2]
          [&>textarea]:resize-none
          [&>textarea]:overflow-x-hidden
          [&>textarea]:text-inherit
          [&>textarea]:[grid-area:1/1/2/2]"
      >
        <Textarea
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyUp={chatEnterPress}
          onKeyDown={preventEnterPress}
          onInput={onInputExpand}
          placeholder={textareaPlaceholder}
          className="h-auto appearance-none pr-20 outline-none"
          disabled={!isLlmModelActive}
        />
      </div>
      {isStreamProcessing ? (
        <Button
          onClick={onCancelStream}
          variant="secondary"
          size="icon"
          className="absolute bottom-6 right-6"
          disabled={isFetchLoading}
        >
          <StopIcon className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          onClick={sendChat}
          variant="secondary"
          size="icon"
          className="absolute bottom-6 right-6"
          disabled={isStreamProcessing || isFetchLoading || !isLlmModelActive}
        >
          <DoubleArrowUpIcon className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
