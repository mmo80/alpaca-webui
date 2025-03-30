import { ChatError } from '../api-service';
import { TApiSettingsSchema, TMessage, TModelSchema } from '../types';

export type ChatCompletionsResponse = {
  stream: ReadableStreamDefaultReader<Uint8Array>;
  error: ChatError;
};

export interface Provider {
  models(apiSetting: TApiSettingsSchema, embeddedOnly: boolean): Promise<TModelSchema[]>;

  chatCompletions(
    model: string,
    messages: TMessage[],
    baseUrl: string | null,
    apiKey: string | null | undefined
  ): Promise<ChatCompletionsResponse>;

  cancelChatCompletionStream(): void;
}
