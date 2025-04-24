import { ApiService, HttpMethod } from '../api-service';
import {
  OllamaTagSchema,
  type TApiSettingsSchema,
  type TChatCompletionRequest,
  type TChatCompletionResponse,
  type TChatMessage,
  type TCreateImageResponse,
  type TCustomMessage,
  type TModelSchema,
} from '../types';
import type { ChatCompletionsResponse, Provider } from './provider';

class OllamaProvider implements Provider {
  service: ApiService;
  chatStreamController: AbortController | null = null;

  constructor(service: ApiService) {
    this.service = service;
  }

  public async models(apiSetting: TApiSettingsSchema, embeddedOnly: boolean): Promise<TModelSchema[]> {
    const url = `${this.service.validUrl(apiSetting.url)}/api/tags`;
    const response = await this.service.executeFetch(url, HttpMethod.GET);

    if (response.response == null || response.error.isError) {
      return [];
    }

    const data = await response.response.json();

    const validatedOllamaTag = await OllamaTagSchema.safeParseAsync(data);
    if (!validatedOllamaTag.success) {
      throw validatedOllamaTag.error;
    }

    const models = validatedOllamaTag.data.models.map(
      (m) =>
        ({
          id: m.name,
          object: 'model',
          created: 0,
          embedding: m.details.family.includes('bert'),
        }) as TModelSchema
    );

    if (embeddedOnly) {
      return models.filter((m) => m.embedding);
    }

    return models.filter((m) => !m.embedding);
  }

  public async chatCompletions(
    model: string,
    messages: TCustomMessage[],
    baseUrl: string | null,
    apiKey: string | null | undefined
  ): Promise<ChatCompletionsResponse> {
    const url = `${this.service.validUrl(baseUrl)}/v1/chat/completions`;

    this.chatStreamController = new AbortController();
    const chatStreamSignal = this.chatStreamController.signal;

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

  public cancelChatCompletionStream() {
    if (this.chatStreamController != null && !this.chatStreamController.signal.aborted) {
      this.chatStreamController.abort();
    }
  }

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
}

export default OllamaProvider;
