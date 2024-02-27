import {
  ChatCompletionnRequest,
  ChatMessage,
  ModelsResponseSchema,
  OllamaTag,
  OllamaTagSchema,
  TModelResponseSchema,
} from '@/lib/types';

const keepAlive = '10m';
let chatStreamController: AbortController | null = null;

const validUrl = (url: string | null): string => {
  if (url == null) {
    throw new Error('Invalid URL');
  }
  return url;
}

const getTag = async (baseUrl: string | null): Promise<OllamaTag> => {
  const url = `${validUrl(baseUrl)}/api/tags`;
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

const getModelList = async (baseUrl: string | null, apiKey: string | null): Promise<TModelResponseSchema[]> => {
  const url = `${validUrl(baseUrl)}/v1/models`;

  let headers = new Headers({
    'Content-Type': 'application/json',
  });

  if (apiKey != null && apiKey.length > 0) {
    headers.append('Authorization', `Bearer ${apiKey}`);
  }

  let response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: headers,
    });
  } catch (error) {
    throw new Error(`Failed to fetch data from ${url}. Check that server is online and reachable. ${error}`);
  }

  if (response.status !== 200) {
    throw new Error(`API request failed with status code: ${response.status}:`);
  }

  const data: unknown = await response.json();
  const validatedModelList = await ModelsResponseSchema.safeParseAsync(data);
  if (!validatedModelList.success) {
    throw validatedModelList.error;
  }
  return validatedModelList.data;
};

const cancelChatStream = async () => {
  if (chatStreamController != null && !chatStreamController.signal.aborted) {
    chatStreamController.abort();
  }
};

const getChatStream = async (
  model: string,
  messages: ChatMessage[],
  apiKey: string | null,
  baseUrl: string | null
): Promise<ReadableStreamDefaultReader<Uint8Array>> => {
  const url = `${validUrl(baseUrl)}/v1/chat/completions`;

  const payload: ChatCompletionnRequest = {
    model: model,
    messages: messages,
    stream: true,
  };

  let headers = new Headers({
    'Content-Type': 'application/json',
  });

  if (apiKey != null && apiKey.length > 0) {
    headers.append('Authorization', `Bearer ${apiKey}`);
  }

  let response;
  try {
    chatStreamController = new AbortController();
    const chatStreamSignal = chatStreamController.signal;

    response = await fetch(url, {
      method: 'POST',
      headers: headers,
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
  getModelList,
  getChatStream,
  cancelChatStream,
};
