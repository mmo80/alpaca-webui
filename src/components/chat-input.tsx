import React, { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { useModelStore } from '@/lib/store';
import { DoubleArrowUpIcon, StopIcon } from '@radix-ui/react-icons';

interface ChatInputProps {
  onSendInputAsync: (input: string) => Promise<void>;
  onCancelStream: () => void;
  placeholder: string;
  workingStream: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendInputAsync, onCancelStream, placeholder, workingStream }) => {
  const { modelName } = useModelStore();
  const [chatInput, setChatInput] = useState<string>('');

  const sendChat = async () => {
    await onSendInputAsync(chatInput);
    setChatInput('');
  };

  const chatEnterPress = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !workingStream && modelName != null) {
      await sendChat();
    }
  };

  const preventEnterPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !workingStream && modelName != null) {
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
        placeholder={placeholder}
        className="overflow-hidden pr-20"
        disabled={modelName === null}
      />
      {workingStream ? (
        <Button onClick={onCancelStream} variant="secondary" size="icon" className="absolute bottom-6 right-3">
          <StopIcon className="w-4 h-4" />
        </Button>
      ) : (
        <Button
          onClick={sendChat}
          variant="secondary"
          size="icon"
          className="absolute bottom-6 right-3"
          disabled={workingStream || modelName === null}
        >
          <DoubleArrowUpIcon className="w-4 h-4" />
        </Button>
      )}
    </>
  );
};

export default ChatInput;
