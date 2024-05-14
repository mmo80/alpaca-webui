import {
  TChatCompletionRequest,
  TChatMessage,
  TEmbedDocumentResponse,
  EmbedDocumentResponseSchema,
  ModelsResponseSchema,
  OllamaModel,
  OllamaTagSchema,
  TModelResponseSchema,
  TApiSettingsSchema,
  TCreateImageRequest,
  CreateImageRequestSchema,
  TCreateImageResponse,
  TMessage,
} from '@/lib/types';
import { ApiService } from './data';

let chatStreamController: AbortController | null = null;

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
}

const validUrl = (url: string | null | undefined): string => {
  if (url == null || url == undefined) {
    throw new Error('Invalid URL');
  }
  return url;
};

const getTag = async (baseUrl: string | undefined, embeddedOnly: boolean): Promise<OllamaModel[]> => {
  const url = `${validUrl(baseUrl)}/api/tags`;
  const response = await executeFetch(url, HttpMethod.GET);
  const data = await response.json();

  const validatedOllamaTag = await OllamaTagSchema.safeParseAsync(data);
  if (!validatedOllamaTag.success) {
    throw validatedOllamaTag.error;
  }
  if (embeddedOnly) {
    return (validatedOllamaTag.data.models = validatedOllamaTag.data.models.filter((model) =>
      model.details.family.includes('bert')
    ));
  }
  return validatedOllamaTag.data.models;
};

const getModelList = async (apiSetting: TApiSettingsSchema, embeddedOnly: boolean): Promise<TModelResponseSchema[]> => {
  const url = `${validUrl(apiSetting.url)}/v1/models`;
  const response = await executeFetch(url, HttpMethod.GET, apiSetting.apiKey);
  let data = await response.json();

  // ugly fix for Together model list as they don't respect the OpenAI API model contract
  if (apiSetting.serviceId !== ApiService.TOGETHER) {
    data = data.data;
  }

  if (embeddedOnly) {
    switch (apiSetting.serviceId) {
      case ApiService.OPENAI:
        data = data.filter((model: TModelResponseSchema) => model.id.indexOf('embedding') !== -1);
        break;
      case ApiService.TOGETHER:
        data = data.filter((model: TModelResponseSchema) => model.type === 'embedding');
        break;
      case ApiService.MISTRAL:
        data = data.filter((model: TModelResponseSchema) => model.id === 'mistral-embed');
        break;
      default:
        data = [];
        break;
    }
  }

  const validatedModelList = await ModelsResponseSchema.safeParseAsync(data);
  if (!validatedModelList.success) {
    console.error(validatedModelList.error);
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
  messages: TMessage[],
  baseUrl: string | null,
  apiKey: string | null | undefined
): Promise<ReadableStreamDefaultReader<Uint8Array>> => {
  const url = `${validUrl(baseUrl)}/v1/chat/completions`;

  chatStreamController = new AbortController();
  const chatStreamSignal = chatStreamController.signal;

  const payload: TChatCompletionRequest = {
    model: model,
    messages: messages as TChatMessage[],
    stream: true,
  };

  const response = await executeFetch(url, HttpMethod.POST, apiKey, payload, chatStreamSignal);

  if (response.body == null) {
    throw new Error(`API request failed with empty response body`);
  }

  return response.body.getReader();
};

const generateImage = async (
  prompt: string,
  model: string,
  baseUrl: string | null,
  apiKey: string | null | undefined
): Promise<TCreateImageResponse> => {
  const url = `${validUrl(baseUrl)}/v1/images/generations`;
  const values: Partial<TCreateImageRequest> = { prompt: prompt, model: model };
  const payload = CreateImageRequestSchema.parse(values);

  const fetchResponse = await executeFetch(url, HttpMethod.POST, apiKey, payload);
  const response = (await fetchResponse.json()) as TCreateImageResponse;

  //console.log('response: ', response);
  return response;
};

const embedDocument = async (
  documentId: number,
  embedModel: string,
  apiSetting: TApiSettingsSchema
): Promise<TEmbedDocumentResponse> => {
  validUrl(apiSetting.url);

  const payload = {
    embedModel: embedModel,
    documentId: documentId,
    apiSetting: apiSetting,
  };
  const response = await executeFetch(`/api/documents/embed`, HttpMethod.POST, null, payload);
  const data = await response.json();

  const validator = await EmbedDocumentResponseSchema.safeParseAsync(data);
  if (!validator.success) {
    throw validator.error;
  }
  return validator.data;
};

export const api = {
  getTag,
  getModelList,
  getChatStream,
  cancelChatStream,
  embedDocument,
  generateImage,
};

export const executeFetch = async <T>(
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

  //console.debug(console.log(JSON.stringify(payload, null, 2)));

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
