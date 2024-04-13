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

export enum ApiService {
  OLLAMA = 'Ollama',
  OPENAI = 'OpenAI.com',
  TOGETHER = 'Together.xyz',
  MISTRAL = 'Mistral.ai',
  GROQ = 'Groq.com',
  STANDARD = 'Standard',
}

export const preDefinedApiServices: ApiServiceModel[] = [
  {
    id: ApiService.OLLAMA,
    url: 'http://localhost:11434',
    modelType: apiModelTypeOllama.value,
    embeddingPath: '/api/embeddings',
    hasEmbedding: true,
    lockedModelType: true,
  },
  {
    id: ApiService.OPENAI,
    url: 'https://api.openai.com',
    modelType: apiModelTypeOpenAI.value,
    embeddingPath: '/v1/embeddings',
    hasEmbedding: true,
    lockedModelType: true,
  },
  {
    id: ApiService.TOGETHER,
    url: 'https://api.together.xyz',
    modelType: apiModelTypeOpenAI.value,
    embeddingPath: '/v1/embeddings',
    hasEmbedding: true,
    lockedModelType: true,
  },
  {
    id: ApiService.MISTRAL,
    url: 'https://api.mistral.ai',
    modelType: apiModelTypeOpenAI.value,
    embeddingPath: '/v1/embeddings',
    hasEmbedding: true,
    lockedModelType: true,
  },
  {
    id: ApiService.GROQ,
    url: 'https://api.groq.com/openai',
    modelType: apiModelTypeOpenAI.value,
    embeddingPath: '',
    hasEmbedding: false,
    lockedModelType: true,
  },
  {
    id: ApiService.STANDARD,
    url: 'https://',
    modelType: apiModelTypeOpenAI.value,
    embeddingPath: '',
    hasEmbedding: false,
    lockedModelType: false,
  },
] as const;

export const fileUploadFolder = './uploads/';
export const appName = 'Alpaca WebUI';
