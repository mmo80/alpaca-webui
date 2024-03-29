import React, { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { useModelStore } from '@/lib/store';
import { DoubleArrowUpIcon, StopIcon } from '@radix-ui/react-icons';

interface ChatInputProps {
  onSendInput: (input: string) => Promise<void>;
  onCancelStream: () => void;
  chatInputPlaceholder: string;
  isStreamProcessing: boolean;
  isFetchLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendInput, onCancelStream, chatInputPlaceholder, isStreamProcessing, isFetchLoading }) => {
  const { modelName } = useModelStore(); // TODO: replace with isModelChoosen os something similiar
  const [chatInput, setChatInput] = useState<string>('');

  const sendChat = async () => {
    const chatInputTrimmed = chatInput.trim();
    setChatInput('');
    await onSendInput(chatInputTrimmed);
  };

  const chatEnterPress = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isStreamProcessing && !isFetchLoading && modelName != null) {
      await sendChat();
    }
  };

  const preventEnterPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isStreamProcessing && !isFetchLoading && modelName != null) {
      e.preventDefault();
    }
  };

  return (
    <>
      <Textarea
        value={chatInput}
        onChange={(e) => setChatInput(e.target.value)}
        onKeyUp={chatEnterPress}
        onKeyDown={preventEnterPress}
        placeholder={chatInputPlaceholder}
        className="overflow-hidden pr-20"
        disabled={modelName === null}
      />
      {isStreamProcessing ? (
        <Button onClick={onCancelStream} variant="secondary" size="icon" className="absolute bottom-6 right-3" disabled={isFetchLoading}>
          <StopIcon className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          onClick={sendChat}
          variant="secondary"
          size="icon"
          className="absolute bottom-6 right-3"
          disabled={isStreamProcessing || isFetchLoading || modelName === null}
        >
          <DoubleArrowUpIcon className="h-4 w-4" />
        </Button>
      )}
    </>
  );
};
