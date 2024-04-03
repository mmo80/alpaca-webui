import { HttpMethod, executeFetch } from "@/lib/api";
import { getApiService } from "@/lib/data";

type EmbedMessageResponse = {
  embedding: number[];
  totalTokens: number;
};

export const embedMessage = async (message: string, model: string, baseUrl: string | null, apiKey: string | null): Promise<EmbedMessageResponse> => {
  let payload = {};
  const apiService = getApiService(baseUrl);
  if (apiService === undefined) {
    throw new Error(`API service '${baseUrl}' not found.`);
  }

  const url = apiService.url + apiService.embeddingPath;

  if (apiService.modelType === 'ollama') {
    payload = { model: model, prompt: message };
  } else if (apiService.modelType === 'openai') {
    payload = { model: model, input: message };
  }

  const response = await executeFetch(url, HttpMethod.POST, apiKey, payload);
  const data = await response.json();
  let embedding: number[] = [];
  let totalTokens: number | undefined = undefined;

  if (apiService.modelType === 'ollama') {
    embedding = data.embedding;
  } else if (apiService.modelType === 'openai') {
    embedding = data.data[0].embedding;

    if (data.usage && data.usage.total_tokens) {
      totalTokens = data.usage.total_tokens;
      // mistral: data.usage.total_tokens
      // openAI: data.usage.total_tokens
      // together: no token count!
      // ollama: no token count!
    }
  }

  return { embedding, totalTokens: totalTokens || 0 };
}