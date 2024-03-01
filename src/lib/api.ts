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
};

const getTag = async (baseUrl: string | null): Promise<OllamaTag> => {
  const url = `${validUrl(baseUrl)}/api/tags`;
  const response = await fetchData(url, HttpMethod.GET);
  const data = await response.json();

  const validatedOllamaTag = await OllamaTagSchema.safeParseAsync(data);
  if (!validatedOllamaTag.success) {
    throw validatedOllamaTag.error;
  }
  return validatedOllamaTag.data;
};

const getModelList = async (baseUrl: string | null, apiKey: string | null): Promise<TModelResponseSchema[]> => {
  const url = `${validUrl(baseUrl)}/v1/models`;
  const response = await fetchData(url, HttpMethod.GET, apiKey);
  let data = await response.json();

  // ugly fix for mistral model list as they don't respect the OpenAI API model contract
  if (baseUrl?.indexOf('mistral.ai') !== -1) {
    data = data.data;
  }

  const validatedModelList = await ModelsResponseSchema.safeParseAsync(data);
  if (!validatedModelList.success) {
    throw validatedModelList.error;
  }
  return validatedModelList.data;
};

const cancelChatStream = () => {
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

  chatStreamController = new AbortController();
  const chatStreamSignal = chatStreamController.signal;

  const payload: ChatCompletionnRequest = {
    model: model,
    messages: messages,
    stream: true,
  };

  const response = await fetchData(url, HttpMethod.POST, apiKey, payload, chatStreamSignal);

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

const fetchData = async <T>(
  url: string,
  method: HttpMethod,
  apiKey: string | null = null,
  payload: T | null = null,
  abortSignal: AbortSignal | null = null
): Promise<Response> => {
  let headers = new Headers({
    'Content-Type': 'application/json',
  });

  if (apiKey != null && apiKey.length > 0) {
    headers.append('Authorization', `Bearer ${apiKey}`);
  }

  let response;
  try {
    response = await fetch(url, {
      method: method,
      headers: headers,
      body: payload != null ? JSON.stringify(payload) : null,
      signal: abortSignal,
    });
  } catch (error) {
    throw new Error(`Failed to fetch data from ${url}. Check that server is online and reachable. ${error}`);
  }

  if (response.status !== 200) {
    throw new Error(`API request failed with status code: ${response.status}:`);
  }

  return response;
};

enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
}
