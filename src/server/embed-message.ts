import { ApiService, HttpMethod } from '@/lib/api-service';
import { ApiTypeEnum } from '@/lib/providers/data';
import type { TProviderSettings } from '@/lib/types';

type EmbedMessageResponse = {
  embedding: number[];
  totalTokens: number;
};

export const embedMessage = async (
  message: string,
  model: string,
  providerSetting: TProviderSettings
): Promise<EmbedMessageResponse> => {
  let payload = {};
  let embedding: number[] = [];
  let totalTokens: number | undefined = undefined;

  try {
    let url = providerSetting.url + providerSetting.embeddingPath;
    const headers = new Headers({
      'Content-Type': 'application/json',
    });

    const service = new ApiService();

    switch (providerSetting.apiType) {
      case ApiTypeEnum.OLLAMA:
        payload = { model: model, prompt: message };
        break;
      case ApiTypeEnum.OPENAI:
        headers.set('Authorization', `Bearer ${providerSetting.apiKey}`);
        payload = { model: model, input: message };
        break;
      case ApiTypeEnum.GOOGLE:
        url = `${providerSetting.url}/v1beta/${model}:embedContent`;
        headers.set('X-goog-api-key', `${providerSetting.apiKey}`);
        payload = {
          content: {
            parts: [
              {
                text: message,
              },
            ],
          },
          // https://ai.google.dev/gemini-api/docs/embeddings#supported-task-types
          taskType: 'SEMANTIC_SIMILARITY',
        };
        break;
      default:
        throw new Error('Unsupported API type');
    }

    const response = await service.executeFetch(url, HttpMethod.POST, null, payload, null, headers);

    if (response.response == null || response.error.isError) {
      console.error(response.error.errorMessage);
      return {
        embedding: [],
        totalTokens: 0,
      };
    }

    const data = await response.response.json();

    switch (providerSetting.apiType) {
      case ApiTypeEnum.OLLAMA:
        embedding = data.embedding;
        break;
      case ApiTypeEnum.OPENAI:
        embedding = data.data[0].embedding;
        if (data.usage?.total_tokens) {
          totalTokens = data.usage.total_tokens;
        }
        break;
      case ApiTypeEnum.GOOGLE:
        embedding = data.embedding.values;
        break;
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error('Failed to embedd document.');
    }
  }

  return { embedding, totalTokens: totalTokens ?? 0 };
};
