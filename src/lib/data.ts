export const apiServiceModelTypes = [
  { label: 'Ollama - /api/tags', value: 'ollama' },
  { label: 'OpenAI - /v1/models', value: 'openai' },
  { label: 'Manual', value: 'manual' },
] as const;

type ApiServiceModel = {
  id: string;
  url: string;
  modelType: string;
  embeddingPath: string;
  hasEmbedding: boolean;
  hidden: boolean;
};

export const apiServices: ApiServiceModel[] = [
  {
    id: 'Ollama',
    url: 'http://localhost:11434',
    modelType: 'ollama',
    embeddingPath: '/api/embeddings',
    hasEmbedding: true,
    hidden: false,
  },
  {
    id: 'OpenAI',
    url: 'https://api.openai.com',
    modelType: 'openai',
    embeddingPath: '/v1/embeddings',
    hasEmbedding: true,
    hidden: false,
  },
  {
    id: 'Together.ai',
    url: 'https://api.together.xyz',
    modelType: 'openai',
    embeddingPath: '/v1/embeddings',
    hasEmbedding: true,
    hidden: false,
  },
  {
    id: 'Mistral.ai',
    url: 'https://api.mistral.ai',
    modelType: 'openai',
    embeddingPath: '/v1/embeddings',
    hasEmbedding: true,
    hidden: false,
  },
  {
    id: 'Groq',
    url: 'https://api.groq.com/openai',
    modelType: 'openai',
    embeddingPath: '',
    hasEmbedding: false,
    hidden: false,
  },
  { id: 'Default', url: '', modelType: 'openai', embeddingPath: '', hasEmbedding: false, hidden: true },
] as const;

//export const defaultApiService: ApiServiceModel = apiServices.find(({ id }) => id === 'Default') as ApiServiceModel;

export const getApiService = (url: string | null): ApiServiceModel | undefined => {
  return apiServices.find((service) => service.url === url);
};
