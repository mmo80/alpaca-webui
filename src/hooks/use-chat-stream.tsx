import { TChatMessage, ChatRole, TChatCompletionResponse, TCreateImageData, TMessage } from '@/lib/types';
import { isNullOrWhitespace, removeJunkStreamData } from '@/lib/utils';
import { useState } from 'react';

export const useChatStream = () => {
  const [chats, setChats] = useState<TMessage[]>([]);
  const [isStreamProcessing, setIsStreamProcessing] = useState<boolean>(false);

  let assistantChatMessage = '';
  let checkFirstCharSpacing = true;

  function isChat(item: TChatMessage | TCreateImageData): item is TChatMessage {
    return (item as TChatMessage).content !== undefined;
  }

  const updateLastChatsItem = (type: string, content: string = '') => {
    setChats((prevArray) => {
      return prevArray.map((chat, index) => {
        if (isChat(chat)) {
          if (index === prevArray.length - 1) {
            if (type === 'replace') {
              chat.content = chat.content.replace(/[\n\s]+$/, '');
            } else if (type === 'update') {
              chat.content = content;
            }
          }
        }
        return chat;
      });
    });
  };

  const errorType = (error: unknown): string => {
    if (error instanceof Error) {
      return error.name;
    }
    return 'unknown';
  };

  const handleStreamChunk = (jsonString: string) => {
    const streamData = removeJunkStreamData(jsonString);
    if (isNullOrWhitespace(streamData)) return;
    const chatCompletionResponse = JSON.parse(streamData) as TChatCompletionResponse;

    let chunkContent = chatCompletionResponse.choices[0].delta.content;
    if (chunkContent == null || chunkContent == undefined) {
      return;
    }

    if (checkFirstCharSpacing && /\S/.test(chunkContent)) {
      // Remove eventual initial linebreaks and spaces
      assistantChatMessage = '';
      chunkContent = chunkContent.trimStart();
      checkFirstCharSpacing = false;
    }

    assistantChatMessage += chunkContent;
    updateLastChatsItem('update', assistantChatMessage);
  };

  let jsonFaultBuffer: string = '';
  const handleStreamSyntaxError = (str: string): boolean => {
    if (str.startsWith('{"id"')) {
      jsonFaultBuffer = str;
    } else if (str.endsWith('}')) {
      jsonFaultBuffer += str;
      return true;
    }
    return false;
  };

  const handleStream = async (streamReader: ReadableStreamDefaultReader<Uint8Array>) => {
    setIsStreamProcessing(true);
    try {
      setChats((prevArray) => [...prevArray, { content: assistantChatMessage, role: ChatRole.ASSISTANT }]);
      while (true) {
        const { done, value } = await streamReader.read();
        if (done) {
          updateLastChatsItem('replace');
          break;
        }

        const text = new TextDecoder('utf-8').decode(value);
        const objects = text.split('\n');
        for (const obj of objects) {
          if (obj == null || obj.length === 0 || obj === '') continue;
          const jsonString = removeJunkStreamData(obj);
          try {
            handleStreamChunk(jsonString);
          } catch (error) {
            if (errorType(error) === 'SyntaxError') {
              console.warn(`SyntaxError: Failed to parse JSON: '${jsonString}". error: ${error}`);
              const bufferComplete = handleStreamSyntaxError(jsonString);
              if (bufferComplete) {
                console.warn('Merged json string: ', jsonFaultBuffer);
                handleStreamChunk(jsonFaultBuffer);
                jsonFaultBuffer = '';
              }
            } else {
              console.error(`${errorType(error)}: '${jsonString}". error: ${error}`);
            }
          }
        }
      }
    } catch (error) {
      if (errorType(error) === 'AbortError') {
        setChats((prevArray) => [...prevArray, { content: 'Cancel', role: ChatRole.USER }]);
      } else {
        setChats((prevArray) => [...prevArray, { content: (error as any).toString(), role: ChatRole.SYSTEM }]);
      }
    }
    setIsStreamProcessing(false);
  };

  return { chats, setChats, handleStream, isStreamProcessing };
};
