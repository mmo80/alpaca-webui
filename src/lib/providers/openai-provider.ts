import { toast } from 'sonner';
import { apiService, ApiService, HttpMethod } from '../api-service';
import {
  OpenAIModelsResponseSchema,
  type TApiSetting,
  type TChatCompletionRequest,
  type TChatMessage,
  type TOpenAIModelResponseSchema,
  type TModelSchema,
  type TChatCompletionResponse,
  type TCustomMessage,
  type TCreateImageResponse,
  type TCreateImageRequest,
  CreateImageRequestSchema,
} from '../types';
import type { ChatCompletionsResponse, Provider } from './provider';
import { ApiServiceEnum } from './data';

class OpenAIProvider implements Provider {
  service: ApiService;
  chatStreamController: AbortController | null = null;

  constructor(service: ApiService) {
    this.service = service;
  }

  public providerId(): string {
    return ApiServiceEnum.OPENAI;
  }

  public async models(apiSetting: TApiSetting, embeddedOnly: boolean): Promise<TModelSchema[]> {
    const url = `${this.service.validUrl(apiSetting.url)}/v1/models`;

    const response = await this.service.executeFetch(url, HttpMethod.GET, apiSetting.apiKey);

    if (response.response == null || response.error.isError) {
      return [];
    }

    let data = await response.response.json();
    data = data.data;

    if (embeddedOnly) {
      data = data.filter((model: TOpenAIModelResponseSchema) => model.id.indexOf('embedding') !== -1);
    }

    const validatedModelList = await OpenAIModelsResponseSchema.safeParseAsync(data);
    if (!validatedModelList.success) {
      console.error(validatedModelList.error);
      throw validatedModelList.error;
    }

    if (!validatedModelList.data.some((m) => m.id === 'gpt-image-1')) {
      validatedModelList.data.push({
        id: 'gpt-image-1',
        object: 'model',
        created: 0,
        owned_by: 'system',
      });
    }

    return validatedModelList.data.map((m) => ({
      id: m.id,
      object: m.object,
      created: m.created ?? 0,
      type: m.owned_by,
      embedding: m.id.includes('embedding'),
    }));
  }

  public async chatCompletions(
    model: string,
    messages: TCustomMessage[],
    baseUrl: string | null,
    apiKey: string | null | undefined,
    withAbortSignal: boolean
  ): Promise<ChatCompletionsResponse> {
    const url = `${this.service.validUrl(baseUrl)}/v1/chat/completions`;

    let chatStreamSignal: AbortSignal | null = null;

    if (withAbortSignal) {
      this.chatStreamController = new AbortController();
      chatStreamSignal = this.chatStreamController.signal;
    }

    const payload: TChatCompletionRequest = {
      model: model,
      messages: messages as TChatMessage[],
      stream: true,
    };

    const response = await this.service.executeFetch(url, HttpMethod.POST, apiKey, payload, chatStreamSignal);

    if (response.response == null || response.error.isError) {
      return {
        error: response.error,
        stream: this.service.createEmptyStreamReader(),
      };
    }

    if (response.response.body == null) {
      return {
        error: {
          isError: true,
          errorMessage: `API request failed with empty response body`,
        },
        stream: this.service.createEmptyStreamReader(),
      };
    }

    return { stream: response.response.body.getReader(), error: response.error };
  }

  public cancelChatCompletionStream = () => {
    if (this.chatStreamController != null && !this.chatStreamController.signal.aborted) {
      this.chatStreamController.abort();
    }
  };

  public convertResponse(streamData: string): TChatCompletionResponse {
    return JSON.parse(streamData) as TChatCompletionResponse;
  }

  public async generateImage(
    prompt: string,
    model: string,
    baseUrl: string | null,
    apiKey: string | null | undefined
  ): Promise<TCreateImageResponse> {
    let gptImage1 = false;
    if (model.startsWith('gpt-image')) {
      gptImage1 = true;
    }
    if (!model.startsWith('dall-e') && !gptImage1) {
      toast.warning('Can only generate image with dall-e-3, dall-e-2 or gpt-image-1 models');
      return { created: -1, data: [], error: true };
    }

    const url = `${apiService.validUrl(baseUrl)}/v1/images/generations`;
    const values: Partial<TCreateImageRequest> = {
      prompt: prompt,
      model: model,
      quality: gptImage1 ? 'high' : 'standard',
      size: '1024x1024',
    };
    const payload = CreateImageRequestSchema.parse(values);

    const fetchResponse = await apiService.executeFetch(url, HttpMethod.POST, apiKey, payload);
    if (fetchResponse.response == null || fetchResponse.error.isError) {
      toast.error(fetchResponse.error.errorMessage ?? 'Error generating image');
      return { created: -1, data: [], error: true };
    }

    return (await fetchResponse.response.json()) as TCreateImageResponse;
  }
}

export default OpenAIProvider;
