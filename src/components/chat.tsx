import { useEffect, useRef, useState } from 'react';
import { useScrollBottom } from '@/hooks/use-scroll-bottom';
import { ChatMessages } from './chat-messages';
import { Spinner } from './spinner';
import { PageDownButton } from './page-down-button';
import { ChatRole, TChatMessage, TCreateImageData, TMessage } from '@/lib/types';

interface ChatProps {
  isFetchLoading: boolean;
  chats: TMessage[];
  mainDiv: React.RefObject<HTMLDivElement>;
}

export const Chat: React.FC<ChatProps> = ({ isFetchLoading, chats, mainDiv }) => {
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

  function isChat(item: TChatMessage | TCreateImageData): item is TChatMessage {
    return (item as TChatMessage).content !== undefined;
  }

  const render = (message: TMessage, index: number) => {
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
        {isFetchLoading && <Spinner />}
      </div>

      {!isScrollBottom && (
        <PageDownButton
          onClick={directScrollToBottom}
          className="animate-bounce-short fixed bottom-24 right-9 animate-bounce rounded-full border-white hover:animate-none"
        />
      )}
    </>
  );
};
