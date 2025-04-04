import { ApiService, HttpMethod } from '../api-service';
import {
  GoogleModelsResponseSchema,
  TApiSettingsSchema,
  TChatMessage,
  TMessage,
  TModelSchema,
  TGoogleChatCompletionRequestSchema,
  TChatCompletionResponse,
  ChatRole,
  TGoogleChatCompletionResponseSchema,
} from '../types';
import { ChatCompletionsResponse, Provider } from './provider';

class GoogleProvider implements Provider {
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

    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('X-goog-api-key', `${payload.apiKey}`);

    const url = `${this.service.validUrl(apiSetting.url)}/v1/models`;

    const response = await this.service.executeFetch(url, HttpMethod.GET, null, null, null, headers);
    if (response.response == null || response.error.isError) {
      return [];
    }
    let data = await response.response.json();

    const validatedModelList = await GoogleModelsResponseSchema.safeParseAsync(data.models);
    if (!validatedModelList.success) {
      console.error(validatedModelList.error);
      throw validatedModelList.error;
    }

    const models = validatedModelList.data.map(
      (m) =>
        ({
          id: m.name,
          object: 'model',
          created: 0,
          type: null,
          embedding: m.supportedGenerationMethods.includes('embedContent'),
        }) as TModelSchema
    );

    if (embeddedOnly) {
      return models.filter((m) => m.embedding);
    }

    return models.filter((m) => !m.embedding);
  }

  public async chatCompletions(
    model: string,
    messages: TMessage[],
    baseUrl: string | null,
    apiKey: string | null | undefined
  ): Promise<ChatCompletionsResponse> {
    this.chatStreamController = new AbortController();
    const chatStreamSignal = this.chatStreamController.signal;

    const payload: TGoogleChatCompletionRequestSchema = {
      contents: messages.map((m: TMessage) => {
        return {
          role: (m as TChatMessage).role == ChatRole.USER ? 'user' : 'model',
          parts: [{ text: (m as TChatMessage).content }],
        };
      }),
    };

    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('X-goog-api-key', `${apiKey}`);

    const url = `${this.service.validUrl(baseUrl)}/v1beta/${model}:streamGenerateContent?alt=sse`;

    const response = await this.service.executeFetch(url, HttpMethod.POST, null, payload, chatStreamSignal, headers);

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
    const response = JSON.parse(streamData) as TGoogleChatCompletionResponseSchema;
    return {
      choices: response.candidates.map((c, i) => {
        return {
          index: i,
          delta: {
            content: c.content.parts[0].text,
            role: c.content.role == 'model' ? ChatRole.ASSISTANT : ChatRole.USER,
          },
        };
      }),
    } as TChatCompletionResponse;
  };
}

export default GoogleProvider;
