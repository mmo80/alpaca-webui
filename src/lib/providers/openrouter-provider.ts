import { ApiService, HttpMethod } from '../api-service';
import {
  type TProviderSettings,
  type TChatCompletionRequest,
  type TChatMessage,
  type TModelSchema,
  type TChatCompletionResponse,
  OpenRouterModelsResponseSchema,
  type TCustomMessage,
  type TCreateImageResponse,
} from '../types';
import { ApiProviderEnum } from './data';
import type { ChatCompletionsResponse, Provider } from './provider';

class OpenRouterProvider implements Provider {
  service: ApiService;
  chatStreamController: AbortController | null = null;

  constructor(service: ApiService) {
    this.service = service;
  }

  public providerId(): string {
    return ApiProviderEnum.OPENROUTER;
  }

  public async models(providerSetting: TProviderSettings, embeddedOnly: boolean): Promise<TModelSchema[]> {
    const url = `${this.service.validUrl(providerSetting.url)}/api/v1/models`;

    const response = await this.service.executeFetch(url, HttpMethod.GET, providerSetting.apiKey);

    if (response.response == null || response.error.isError) {
      return [];
    }

    let data = await response.response.json();
    data = data.data;

    if (embeddedOnly) {
      data = [];
    }

    const validatedModelList = await OpenRouterModelsResponseSchema.safeParseAsync(data);
    if (!validatedModelList.success) {
      console.error(validatedModelList.error);
      throw validatedModelList.error;
    }

    return validatedModelList.data.map((m) => ({
      id: m.id,
      object: m.name,
      created: m.created ?? 0,
      embedding: false,
    }));
  }

  public async chatCompletions(
    model: string,
    messages: TCustomMessage[],
    baseUrl: string | null,
    apiKey: string | null | undefined,
    withAbortSignal: boolean
  ): Promise<ChatCompletionsResponse> {
    const url = `${this.service.validUrl(baseUrl)}/api/v1/chat/completions`;

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
    console.warn(
      'generateImage is not implemented for this provider. Please use a different provider or implement the generateImage method in your provider class.'
    );
    return { created: -1, data: [], error: true };
  }

  public titleGenerationModel(model: string): string {
    return model;
  }
}

export default OpenRouterProvider;
