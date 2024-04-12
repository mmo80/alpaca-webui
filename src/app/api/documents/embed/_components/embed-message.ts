import { HttpMethod, executeFetch } from '@/lib/api';
import { apiModelTypeOllama, apiModelTypeOpenAI } from '@/lib/data';
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
    // if (modelType == null || modelType == '' || modelType.length <= 0) {
    //   throw new Error(`ModelType can not be null or empty '${modelType}'.`);
    // }
    // if (model == null || model == '' || model.length <= 0) {
    //   throw new Error(`Model can not be null or empty '${model}'.`);
    // }
    // if (baseUrl == null || baseUrl == '' || !baseUrl.startsWith('http')) {
    //   throw new Error(`Invalid base url '${baseUrl}'.`);
    // }

    // let apiService: ApiServiceModel | undefined = undefined;

    // if (modelType == apiModelTypeOllama.value) {
    //   apiService = ollamaApiService;
    // } else if (modelType == apiModelTypeOpenAI.value) {
    //   apiService = getApiServiceByUrl(baseUrl);
    // }

    // if (apiService === undefined) {
    //   throw new Error(`API service '${baseUrl}' not supported.`);
    // }
    // if (!apiService.hasEmbedding) {
    //   throw new Error(`API service '${baseUrl}' does not support embedding.`);
    // }

    const url = apiSetting.url + apiSetting.embeddingPath;

    if (apiSetting.modelListType === apiModelTypeOllama.value) {
      payload = { model: model, prompt: message };
    } else if (apiSetting.modelListType === apiModelTypeOpenAI.value) {
      payload = { model: model, input: message };
    }

    const response = await executeFetch(url, HttpMethod.POST, apiSetting.apiKey, payload);
    const data = await response.json();

    if (apiSetting.modelListType === apiModelTypeOllama.value) {
      embedding = data.embedding;
    } else if (apiSetting.modelListType === apiModelTypeOpenAI.value) {
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
