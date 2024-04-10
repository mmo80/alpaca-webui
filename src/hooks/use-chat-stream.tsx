import { TChatMessage, ChatRole } from '@/lib/types';
import { parseJsonStream } from '@/lib/utils';
import { useState } from 'react';

export const useChatStream = () => {
  const [chats, setChats] = useState<TChatMessage[]>([]);
  const [isStreamProcessing, setIsStreamProcessing] = useState<boolean>(false);

  const updateLastChatsItem = (type: string, content: string = '') => {
    setChats((prevArray) => {
      return prevArray.map((chat, index) => {
        if (index === prevArray.length - 1) {
          if (type === 'replace') {
            chat.content = chat.content.replace(/[\n\s]+$/, '');
          } else if (type === 'update') {
            chat.content = content;
          }
        }
        return chat;
      });
    });
  };

  const handleStream = async (streamReader: ReadableStreamDefaultReader<Uint8Array>) => {
    setIsStreamProcessing(true);
    try {
      let assistantChatMessage = '';
      const decoder = new TextDecoder();

      setChats((prevArray) => [...prevArray, { content: assistantChatMessage, role: ChatRole.ASSISTANT }]);

      let checkFirstCharSpacing = true;
      while (true) {
        const { done, value } = await streamReader.read();

        if (done) {
          updateLastChatsItem('replace');
          break;
        }

        const decodedChunk = decoder.decode(value, { stream: true });
        const chunkList = parseJsonStream(decodedChunk);
        if (chunkList != null && chunkList.length > 0) {
          for (const chunkObj of chunkList) {
            if (chunkObj?.id == null) {
              continue;
            }

            let chunkContent = chunkObj.choices[0].delta.content;
            if (chunkContent == null || chunkContent == undefined) {
              continue;
            }
            if (checkFirstCharSpacing && /\S/.test(chunkContent)) {
              // Remove eventual initial linebreaks and spaces
              assistantChatMessage = '';
              chunkContent = chunkContent.trimStart();
              checkFirstCharSpacing = false;
            }

            assistantChatMessage += chunkContent;

            updateLastChatsItem('update', assistantChatMessage);
          }
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          setChats((prevArray) => [...prevArray, { content: 'Cancel', role: ChatRole.USER }]);
        } else {
          setChats((prevArray) => [...prevArray, { content: (error as Error).message, role: ChatRole.SYSTEM }]);
        }
      } else {
        console.error(error);
      }
    }
    setIsStreamProcessing(false);
  };

  return { chats, setChats, handleStream, isStreamProcessing };
};
