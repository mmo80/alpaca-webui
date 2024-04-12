import React, { FC, useEffect, useState } from 'react';
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

  useEffect(() => {
    setTextareaPlaceholder(chatInputPlaceholder);
  }, [chatInputPlaceholder]);

  const sendChat = async () => {
    const chatInputTrimmed = chatInput.trim();
    setChatInput('');
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

  return (
    <div className="px-3">
      <Textarea
        value={chatInput}
        onChange={(e) => setChatInput(e.target.value)}
        onKeyUp={chatEnterPress}
        onKeyDown={preventEnterPress}
        placeholder={textareaPlaceholder}
        className="resize-none overflow-hidden pr-20"
        disabled={!isLlmModelActive}
      />
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
