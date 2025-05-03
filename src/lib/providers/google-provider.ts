import { ApiService, HttpMethod } from '../api-service';
import {
  GoogleModelsResponseSchema,
  type TApiSetting,
  type TChatMessage,
  type TModelSchema,
  type TGoogleChatCompletionRequestSchema,
  type TChatCompletionResponse,
  ChatRole,
  type TGoogleChatCompletionResponseSchema,
  type TCustomMessage,
  type TCreateImageResponse,
} from '../types';
import { ApiServiceEnum } from './data';
import type { ChatCompletionsResponse, Provider } from './provider';

class GoogleProvider implements Provider {
  service: ApiService;
  chatStreamController: AbortController | null = null;

  constructor(service: ApiService) {
    this.service = service;
  }

  public providerId(): string {
    return ApiServiceEnum.GOOGLE;
  }

  public async models(apiSetting: TApiSetting, embeddedOnly: boolean): Promise<TModelSchema[]> {
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
    messages: TCustomMessage[],
    baseUrl: string | null,
    apiKey: string | null | undefined,
    withAbortSignal: boolean
  ): Promise<ChatCompletionsResponse> {
    let chatStreamSignal: AbortSignal | null = null;

    if (withAbortSignal) {
      this.chatStreamController = new AbortController();
      chatStreamSignal = this.chatStreamController.signal;
    }

    const payload: TGoogleChatCompletionRequestSchema = {
      contents: messages.map((m: TCustomMessage) => {
        const msg = m as TChatMessage;
        let content = '';
        if (msg?.content) {
          content = msg.content as string;
        }

        return {
          role: msg.role == ChatRole.USER ? 'user' : 'model',
          parts: [{ text: content }],
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

  public convertResponse(streamData: string): TChatCompletionResponse {
    const response = JSON.parse(streamData) as TGoogleChatCompletionResponseSchema;
    return {
      choices: response.candidates.map((c, i) => {
        return {
          index: i,
          delta: {
            content: c.content.parts[0]?.text,
            role: c.content.role == 'model' ? ChatRole.ASSISTANT : ChatRole.USER,
          },
        };
      }),
    } as TChatCompletionResponse;
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

export default GoogleProvider;
