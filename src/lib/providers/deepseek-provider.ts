import { ApiService, HttpMethod } from '../api-service';
import {
  OpenAIModelsResponseSchema,
  type TApiSettingsSchema,
  type TChatCompletionRequest,
  type TChatMessage,
  type TModelSchema,
  type TChatCompletionResponse,
  type TCustomMessage,
} from '../types';
import type { ChatCompletionsResponse, Provider } from './provider';

class DeepseekProvider implements Provider {
  service: ApiService;
  chatStreamController: AbortController | null = null;

  constructor(service: ApiService) {
    this.service = service;
  }

  public async models(apiSetting: TApiSettingsSchema, embeddedOnly: boolean): Promise<TModelSchema[]> {
    const url = `${this.service.validUrl(apiSetting.url)}/v1/models`;

    const response = await this.service.executeFetch(url, HttpMethod.GET, apiSetting.apiKey);

    if (response.response == null || response.error.isError) {
      return [];
    }

    let data = await response.response.json();

    if (embeddedOnly) {
      data = [];
    }

    const validatedModelList = await OpenAIModelsResponseSchema.safeParseAsync(data.data);
    if (!validatedModelList.success) {
      console.error(validatedModelList.error);
      throw validatedModelList.error;
    }

    return validatedModelList.data.map((m) => ({
      id: m.id,
      object: m.object,
      created: 0,
      type: m.type,
      embedding: false,
    }));
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

  public cancelChatCompletionStream = () => {
    if (this.chatStreamController != null && !this.chatStreamController.signal.aborted) {
      this.chatStreamController.abort();
    }
  };

  public convertResponse = (streamData: string): TChatCompletionResponse => {
    return JSON.parse(streamData) as TChatCompletionResponse;
  };
}

export default DeepseekProvider;
