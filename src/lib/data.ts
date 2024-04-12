export const apiServiceModelTypes = [
  { label: 'Ollama - /api/tags', value: 'ollama' },
  { label: 'OpenAI - /v1/models', value: 'openai' },
  { label: 'Manual', value: 'manual' },
] as const;

export const apiModelTypeOllama = apiServiceModelTypes[0];
export const apiModelTypeOpenAI = apiServiceModelTypes[1];

export type ApiServiceModel = {
  id: string;
  url: string;
  modelType: string;
  embeddingPath: string;
  hasEmbedding: boolean;
  lockedModelType: boolean;
};

export const preDefinedApiServices: ApiServiceModel[] = [
  {
    id: 'Ollama',
    url: 'http://localhost:11434',
    modelType: apiModelTypeOllama.value,
    embeddingPath: '/api/embeddings',
    hasEmbedding: true,
    lockedModelType: true,
  },
  {
    id: 'OpenAI.com',
    url: 'https://api.openai.com',
    modelType: apiModelTypeOpenAI.value,
    embeddingPath: '/v1/embeddings',
    hasEmbedding: true,
    lockedModelType: true,
  },
  {
    id: 'Together.xyz',
    url: 'https://api.together.xyz',
    modelType: apiModelTypeOpenAI.value,
    embeddingPath: '/v1/embeddings',
    hasEmbedding: true,
    lockedModelType: true,
  },
  {
    id: 'Mistral.ai',
    url: 'https://api.mistral.ai',
    modelType: apiModelTypeOpenAI.value,
    embeddingPath: '/v1/embeddings',
    hasEmbedding: true,
    lockedModelType: true,
  },
  {
    id: 'Groq.com',
    url: 'https://api.groq.com/openai',
    modelType: apiModelTypeOpenAI.value,
    embeddingPath: '',
    hasEmbedding: false,
    lockedModelType: true,
  },
  {
    id: 'Standard',
    url: 'https://',
    modelType: apiModelTypeOpenAI.value,
    embeddingPath: '',
    hasEmbedding: false,
    lockedModelType: false,
  },
] as const;

export const fileUploadFolder = './uploads/';
export const appName = 'Alpaca WebUI';
