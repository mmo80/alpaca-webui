import { ChatMessage, OllamaTag, OllamaTagSchema } from '@/lib/types';

const keepAlive = '10m';
let ollamaBaseUrl = 'http://localhost:11434';
let chatStreamController: AbortController | null = null;

const getTag = async (): Promise<OllamaTag> => {
  const url = `${ollamaBaseUrl}/api/tags`;
  let response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    throw new Error(`Failed to fetch data from ${url}. Check that server is online and reachable. ${error}`);
  }

  if (response.status !== 200) {
    throw new Error(`API request failed with status code: ${response.status}:`);
  }

  const data: unknown = await response.json();
  const validatedOllamaTag = await OllamaTagSchema.safeParseAsync(data);
  if (!validatedOllamaTag.success) {
    throw validatedOllamaTag.error;
  }
  return validatedOllamaTag.data;
};

const cancelChatStream = async () => {
  if (chatStreamController != null && !chatStreamController.signal.aborted) {
    chatStreamController.abort();
  }
};

const getChatStream = async (
  model: string,
  messages: ChatMessage[]
): Promise<ReadableStreamDefaultReader<Uint8Array>> => {
  const url = `${ollamaBaseUrl}/api/chat`;
  const payload = {
    model: model,
    messages: messages,
    stream: true,
  };

  let response;
  try {
    chatStreamController = new AbortController();
    const chatStreamSignal = chatStreamController.signal;

    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: chatStreamSignal,
    });
  } catch (error) {
    throw new Error(`Failed to fetch data from ${url}. Check that server is online and reachable. ${error}`);
  }

  if (response.status !== 200) {
    throw new Error(`API request failed with status code: ${response.status}:`);
  }

  if (response.body == null) {
    throw new Error(`API request failed with empty response body`);
  }

  return response.body.getReader();
};

export const api = {
  getTag,
  getChatStream,
  cancelChatStream,
  setOllamaBaseUrl: (url: string) => {
    if (url.indexOf('http') === -1) {
      throw new Error('Invalid URL');
    }
    ollamaBaseUrl = url;
  },
};
