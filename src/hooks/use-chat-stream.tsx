import {
  ChatRole,
  type TChatCompletionResponse,
  type TCustomMessage,
  type TCustomChatMessage,
  type TCustomCreateImageData,
  type TCustomProviderSchema,
  defaultProvider,
  CustomMessageSchema,
} from '@/lib/types';
import { hasNonWhitespaceChars, isEmpty, isNullOrWhitespace, removeJunkStreamData } from '@/lib/utils';
import { useState } from 'react';

export const useChatStream = () => {
  const [chats, setChats] = useState<TCustomMessage[]>([]);
  const [isStreamProcessing, setIsStreamProcessing] = useState<boolean>(false);

  const chatMessageChunks: string[] = [];
  const jsonStringFaultBuffers: string[] = [];
  let checkFirstCharSpacing = true;
  let hasReasoningContent = false;
  let isReasoning = false;

  function isChat(item: TCustomChatMessage | TCustomCreateImageData): item is TCustomChatMessage {
    return (item as TCustomChatMessage).content !== undefined;
  }

  const updateLastChatsItem = (type: 'finish' | 'update', content: string = '', isReasoning: boolean = false) => {
    setChats((prevArray) => {
      return prevArray.map((chat, index) => {
        if (isChat(chat)) {
          if (index === prevArray.length - 1 && chat.role === ChatRole.ASSISTANT) {
            if (type === 'finish') {
              chat.content = (chat.content as string).replace(/[\n\s]+$/, '');
              chat.streamComplete = true;
              chat.isReasoning = false;
            } else if (type === 'update') {
              chat.content = content;
              chat.isReasoning = isReasoning;
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

  const handleStreamChunk = (jsonString: string, convertResponse: (streamData: string) => TChatCompletionResponse) => {
    const streamData = removeJunkStreamData(jsonString);
    if (isNullOrWhitespace(streamData)) return;

    const chatCompletionResponse = convertResponse(streamData);

    let content = chatCompletionResponse.choices[0]!.delta.content;
    let chunkReasoningContent =
      chatCompletionResponse.choices[0]?.delta.reasoning_content ?? chatCompletionResponse.choices[0]?.delta.reasoning;

    if (content == '<think>') {
      isReasoning = true;
    } else if (content == '</think>') {
      isReasoning = false;
    }

    if (!hasReasoningContent && hasNonWhitespaceChars(chunkReasoningContent)) {
      hasReasoningContent = true;
      if (chatMessageChunks.length === 0) {
        chatMessageChunks.push('<think>');
      }
    }

    if (hasReasoningContent && hasNonWhitespaceChars(chunkReasoningContent)) {
      chatMessageChunks.push(chunkReasoningContent ?? '');
      updateLastChatsItem('update', chatMessageChunks.join(''), true);
      return;
    }

    let chunkContent = content as string;
    if (!chunkContent) return;

    if (hasReasoningContent && isEmpty(chunkReasoningContent) && hasNonWhitespaceChars(chunkContent)) {
      chatMessageChunks.push('</think>');
      hasReasoningContent = false;
    }

    if (checkFirstCharSpacing && hasNonWhitespaceChars(chunkContent)) {
      // Remove eventual initial linebreaks and spaces
      chunkContent = chunkContent.trimStart();
      checkFirstCharSpacing = false;
    }

    chatMessageChunks.push(chunkContent);
    updateLastChatsItem('update', chatMessageChunks.join(''), isReasoning);
  };

  const handleStreamSyntaxError = (str: string): boolean => {
    if (str.startsWith('{"id"')) {
      jsonStringFaultBuffers.push(str);
    } else if (str.endsWith('}')) {
      jsonStringFaultBuffers.push(str);
      return true;
    }
    return false;
  };

  const handleIncompleteStreamAndError = async (error: unknown): Promise<void> => {
    if (errorType(error) !== 'AbortError') {
      setChats((prevArray) => [
        ...prevArray,
        CustomMessageSchema.parse({
          content: (error as any).toString(),
          role: ChatRole.SYSTEM,
          provider: defaultProvider,
        }),
      ]);
      return;
    }

    setChats((prevChats) => {
      const updatedChats = [...prevChats];

      // Mark the last message as complete and mark it as cancelled
      if (updatedChats.length > 0) {
        const lastChat = updatedChats[updatedChats.length - 1];
        updatedChats[updatedChats.length - 1] = CustomMessageSchema.parse({
          ...lastChat,
          streamComplete: true,
          cancelled: true,
          isReasoning: false,
        });
      }

      return updatedChats;
    });
  };

  const handleStream = async (
    streamReader: ReadableStreamDefaultReader<Uint8Array>,
    provider: TCustomProviderSchema,
    convertResponse: (streamData: string) => TChatCompletionResponse
  ): Promise<void> => {
    setIsStreamProcessing(true);
    const decoder = new TextDecoder('utf-8');

    try {
      setChats((prevArray) => [
        ...prevArray,
        CustomMessageSchema.parse({ content: '', role: ChatRole.ASSISTANT, provider: provider, streamComplete: false }),
      ]);

      while (true) {
        const { done, value } = await streamReader.read();
        if (done) {
          updateLastChatsItem('finish');
          break;
        }

        const text = decoder.decode(value, { stream: true });
        const objects = text.split('\n');

        for (const obj of objects) {
          if (obj == null || obj.length === 0 || obj === '') continue;

          const jsonString = removeJunkStreamData(obj);

          try {
            handleStreamChunk(jsonString, convertResponse);
          } catch (error) {
            if (errorType(error) !== 'SyntaxError') {
              console.error(`${errorType(error)}: '${jsonString}". error: `, error);
              throw error;
            }

            const bufferComplete = handleStreamSyntaxError(jsonString);
            if (!bufferComplete) {
              console.warn(`SyntaxError: Failed to parse JSON: '${jsonString}". error: `, error);
              return;
            }

            console.info('* Merged incomplete json string from stream: ', jsonStringFaultBuffers);
            handleStreamChunk(jsonStringFaultBuffers.join(''), convertResponse);
            jsonStringFaultBuffers.length = 0;
          }
        }
      }
    } catch (error) {
      await handleIncompleteStreamAndError(error);
    } finally {
      // Flush the decoder when done
      decoder.decode(new Uint8Array(0), { stream: false });
    }

    setIsStreamProcessing(false);
  };

  return { chats, setChats, handleStream, isStreamProcessing };
};
