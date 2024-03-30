import { useEffect, useRef, useState } from 'react';
import { useScrollBottom } from '@/hooks/use-scroll-bottom';
import { ChatMessage } from '@/lib/types';
import { ChatMessages } from './chat-messages';
import { Spinner } from './spinner';
import { PageDownButton } from './page-down-button';

interface ChatProps {
  isFetchLoading: boolean;
  chats: ChatMessage[];
  mainDiv: React.RefObject<HTMLDivElement>;
}

export const Chat: React.FC<ChatProps> = ({
  isFetchLoading,
  chats,
  mainDiv
}) => {
  const chatsDiv = useRef<HTMLDivElement>(null);
  const { isScrollBottom } = useScrollBottom(mainDiv);

  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const scrollToBottom = () => {
      if (mainDiv.current != null) {
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
    if (mainDiv.current != null) {
      mainDiv.current.scrollTop = mainDiv.current.scrollHeight;
    }
  };

  return (
    <>
      <div className="w-full space-y-4" ref={chatsDiv}>
        {chats.map((message, index) => (
          <ChatMessages role={message.role} content={message.content} key={index} />
        ))}
        {isFetchLoading && <Spinner />}
      </div>

      {!isScrollBottom && (
        <PageDownButton
          onClick={directScrollToBottom}
          className="animate-bounce-short absolute bottom-24 left-1/2 animate-bounce rounded-full hover:animate-none"
        />
      )}
    </>
  );
};
