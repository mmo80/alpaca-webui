import { toast } from 'sonner';
import { ApiService, HttpMethod } from '../api-service';
import type {
  TApiSetting,
  TChatCompletionResponse,
  TChatMessage,
  TCreateImageResponse,
  TCustomMessage,
  TLocalCompletionsRequest,
  TModelSchema,
} from '../types';
import type { ChatCompletionsResponse, Provider } from './provider';
import { ApiServiceEnum } from './data';

class AnthropicProvider implements Provider {
  service: ApiService;
  chatStreamController: AbortController | null = null;

  constructor(service: ApiService) {
    this.service = service;
  }

  public providerId(): string {
    return ApiServiceEnum.ANTHROPIC;
  }

  public async models(apiSetting: TApiSetting, embeddedOnly: boolean): Promise<TModelSchema[]> {
    const payload = {
      apiKey: apiSetting.apiKey ?? '',
      baseUrl: this.service.validUrl(apiSetting.url),
    };

    const response = await this.service.executeFetch(
      `/api/provider/anthropic/model?apiKey=${payload.apiKey}&baseUrl=${payload.baseUrl}`,
      HttpMethod.GET,
      null,
      null
    );

    if (response.response == null || response.error.isError) {
      return [];
    }

    let data = (await response.response.json()) as TModelSchema[];

    if (embeddedOnly) {
      data = [];
    }

    return data;
  }

  public async chatCompletions(
    model: string,
    messages: TCustomMessage[],
    baseUrl: string | null,
    apiKey: string | null | undefined
  ): Promise<ChatCompletionsResponse> {
    this.chatStreamController = new AbortController();
    const chatStreamSignal = this.chatStreamController.signal;

    const payload: TLocalCompletionsRequest = {
      model: model,
      messages: messages as TChatMessage[],
      apiKey: apiKey ?? '',
      baseUrl: baseUrl ?? '',
    };

    const response = await this.service.executeFetch(
      `/api/provider/anthropic/chat/completions`,
      HttpMethod.POST,
      null,
      payload,
      chatStreamSignal
    );

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
    toast.warning(
      'generateImage is not implemented for this provider. Please use a different provider or implement the generateImage method in your provider class.'
    );
    return { created: -1, data: [], error: true };
  }
}

export default AnthropicProvider;
