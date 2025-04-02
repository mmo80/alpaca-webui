import { ApiService, HttpMethod } from '@/lib/api-service';
import { ApiTypeEnum } from '@/lib/providers/data';
import { TApiSettingsSchema } from '@/lib/types';

type EmbedMessageResponse = {
  embedding: number[];
  totalTokens: number;
};

export const embedMessage = async (
  message: string,
  model: string,
  apiSetting: TApiSettingsSchema
): Promise<EmbedMessageResponse> => {
  let payload = {};
  let embedding: number[] = [];
  let totalTokens: number | undefined = undefined;

  try {
    const url = apiSetting.url + apiSetting.embeddingPath;

    if (apiSetting.apiType === ApiTypeEnum.OLLAMA) {
      payload = { model: model, prompt: message };
    } else if (apiSetting.apiType === ApiTypeEnum.OPENAI) {
      payload = { model: model, input: message };
    }

    const apiService = new ApiService();
    const response = await apiService.executeFetch(url, HttpMethod.POST, apiSetting.apiKey, payload);

    if (response.response == null || response.error.isError) {
      console.error(response.error.errorMessage);
      return {
        embedding: [],
        totalTokens: 0,
      };
    }

    const data = await response.response.json();

    if (apiSetting.apiType === ApiTypeEnum.OLLAMA) {
      embedding = data.embedding;
    } else if (apiSetting.apiType === ApiTypeEnum.OPENAI) {
      embedding = data.data[0].embedding;

      if (data.usage?.total_tokens) {
        totalTokens = data.usage.total_tokens;
      }
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
