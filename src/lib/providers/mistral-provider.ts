import { ApiService, HttpMethod } from '../api-service';
import {
  OpenAIModelsResponseSchema,
  TApiSettingsSchema,
  TChatCompletionRequest,
  TChatMessage,
  TMessage,
  TOpenAIModelResponseSchema,
  TModelSchema,
  TChatCompletionResponse,
} from '../types';
import { ChatCompletionsResponse, Provider } from './provider';

class MistralProvider implements Provider {
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
      data = data.filter((model: TOpenAIModelResponseSchema) => model.id === 'mistral-embed');
    }

    const validatedModelList = await OpenAIModelsResponseSchema.safeParseAsync(data);
    if (!validatedModelList.success) {
      console.error(validatedModelList.error);
      throw validatedModelList.error;
    }

    return validatedModelList.data.map((m) => ({
      id: m.id,
      object: m.object,
      created: m.created ? m.created : 0,
      type: m.type,
      embedding: m.id === 'mistral-embed',
    }));
  }

  public async chatCompletions(
    model: string,
    messages: TMessage[],
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

export default MistralProvider;
