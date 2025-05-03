import { type ChatError } from '../api-service';
import {
  type TApiSetting,
  type TChatCompletionResponse,
  type TModelSchema,
  type TCustomMessage,
  type TCreateImageResponse,
} from '../types';

export type ChatCompletionsResponse = {
  stream: ReadableStreamDefaultReader<Uint8Array>;
  error: ChatError;
};

export interface Provider {
  providerId(): string;

  models(apiSetting: TApiSetting, embeddedOnly: boolean): Promise<TModelSchema[]>;

  chatCompletions(
    model: string,
    messages: TCustomMessage[],
    baseUrl: string | null,
    apiKey: string | null | undefined,
    withAbortSignal: boolean
  ): Promise<ChatCompletionsResponse>;

  cancelChatCompletionStream(): void;

  convertResponse(streamData: string): TChatCompletionResponse;

  generateImage(
    prompt: string,
    model: string,
    baseUrl: string | null,
    apiKey: string | null | undefined
  ): Promise<TCreateImageResponse>;

  titleGenerationModel(model: string): string;
}
