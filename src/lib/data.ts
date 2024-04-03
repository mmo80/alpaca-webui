export const apiServiceModelTypes = [
  { label:  'Ollama - /api/tags',   value: 'ollama' },
  { label:  'OpenAI - /v1/models',  value: 'openai' },
  { label:  'Manual',               value: 'manual' },
] as const;

type ApiServiceModel = {
  label: string;
  url: string;
  modelType: string;
  embeddingPath: string;
  hasEmbedding: boolean;
};

export const apiServices: ApiServiceModel[] = [
  { label: 'Ollama',      url: 'http://localhost:11434',      modelType: 'ollama',  embeddingPath: '/api/embeddings', hasEmbedding: true },
  { label: 'OpenAI',      url: 'https://api.openai.com',      modelType: 'openai',  embeddingPath: '/v1/embeddings',  hasEmbedding: true },
  { label: 'Together.ai', url: 'https://api.together.xyz',    modelType: 'openai',  embeddingPath: '/v1/embeddings',  hasEmbedding: true },
  { label: 'Mistral.ai',  url: 'https://api.mistral.ai',      modelType: 'openai',  embeddingPath: '/v1/embeddings',  hasEmbedding: true },
  { label: 'Groq',        url: 'https://api.groq.com/openai', modelType: 'openai',  embeddingPath: '',                hasEmbedding: false },
] as const;

export const getApiService = (url: string | null) : ApiServiceModel | undefined => {
  return apiServices.find((service) => service.url === url);
}