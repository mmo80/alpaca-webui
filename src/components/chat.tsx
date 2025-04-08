import { type FC, useEffect, useRef, useState } from 'react';
import { useScrollBottom } from '@/hooks/use-scroll-bottom';
import { ChatMessages } from './chat-messages';
import { Spinner } from './spinner';
import { PageDownButton } from './page-down-button';
import { ChatRole, type TCustomChatMessage, type TCustomCreateImageData, type TCustomMessage } from '@/lib/types';
import { Button } from './ui/button';
import { ResetIcon } from '@radix-ui/react-icons';

interface ChatProps {
  isFetchLoading: boolean;
  chats: TCustomMessage[];
  mainDiv: React.RefObject<HTMLDivElement | null>;
  onReset: () => void;
}

export const Chat: React.FC<ChatProps> = ({ isFetchLoading, chats, mainDiv, onReset }) => {
  const chatsDiv = useRef<HTMLDivElement>(null);
  const { isScrollBottom } = useScrollBottom(mainDiv);

  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const scrollToBottom = () => {
      if (mainDiv?.current != null) {
        mainDiv.current.scrollTop = mainDiv.current.scrollHeight;
        setTimerRunning(false);
      }
    };

    const delayedScrollToBottom = () => {
      const id = setTimeout(() => {
        scrollToBottom();
      }, 100);
      setTimeoutId(id);
      setTimerRunning(true);
    };

    if (!isScrollBottom && timeoutId != null) {
      clearTimeout(timeoutId);
      setTimerRunning(false);
    }

    if (isScrollBottom && !timerRunning) {
      delayedScrollToBottom();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chats]);

  const directScrollToBottom = () => {
    if (mainDiv?.current != null) {
      mainDiv.current.scrollTop = mainDiv.current.scrollHeight;
    }
  };

  function isChat(item: TCustomChatMessage | TCustomCreateImageData): item is TCustomChatMessage {
    return (item as TCustomChatMessage).content !== undefined;
  }

  const render = (message: TCustomMessage, index: number) => {
    let role = ChatRole.ASSISTANT;
    if (isChat(message)) {
      role = message.role;
    }

    return <ChatMessages role={role} message={message} key={index} />;
  };

  return (
    <>
      <div className="w-full space-y-4" ref={chatsDiv}>
        {chats.map((message, index) => render(message, index))}
        <ResetChatButton onClick={onReset} />
        {isFetchLoading && <Spinner />}
      </div>

      {!isScrollBottom && (
        <PageDownButton
          onClick={directScrollToBottom}
          className="animate-bounce-short fixed right-9 bottom-24 animate-bounce rounded-full border-white hover:animate-none"
        />
      )}
    </>
  );
};

const ResetChatButton: FC<{ onClick: () => void }> = ({ onClick }) => {
  return (
    <Button variant="secondary" onClick={onClick}>
      <ResetIcon className="h-4 w-4 pe-1" />
      Reset Chat
    </Button>
  );
};
