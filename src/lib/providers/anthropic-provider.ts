import { ApiService, HttpMethod } from '../api-service';
import {
  TApiSettingsSchema,
  TChatCompletionResponse,
  TChatMessage,
  TLocalCompletionsRequest,
  TMessage,
  TModelSchema,
} from '../types';
import { ChatCompletionsResponse, Provider } from './provider';

class AnthropicProvider implements Provider {
  service: ApiService;
  chatStreamController: AbortController | null = null;

  constructor(service: ApiService) {
    this.service = service;
  }

  public async models(apiSetting: TApiSettingsSchema, embeddedOnly: boolean): Promise<TModelSchema[]> {
    const payload = {
      apiKey: apiSetting.apiKey ?? '',
      baseUrl: this.service.validUrl(apiSetting.url),
    };

    const response = await this.service.executeFetch(
      `/api/provider/model?apiKey=${payload.apiKey}&baseUrl=${payload.baseUrl}`,
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
    messages: TMessage[],
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
      `/api/provider/chat/completions`,
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

  public convertResponse = (streamData: string): TChatCompletionResponse => {
    return JSON.parse(streamData) as TChatCompletionResponse;
  };
}

export default AnthropicProvider;
