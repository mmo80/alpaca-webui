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

export enum ApiServiceEnum {
  OLLAMA = 'Ollama',
  OPENAI = 'OpenAI.com',
  TOGETHER = 'Together.xyz',
  MISTRAL = 'Mistral.ai',
  GROQ = 'Groq.com',
  STANDARD = 'Standard',
  ANTHROPIC = 'Anthropic',
}

export const preDefinedApiServices: ApiServiceModel[] = [
  {
    id: ApiServiceEnum.OLLAMA,
    url: 'http://localhost:11434',
    modelType: apiModelTypeOllama.value,
    embeddingPath: '/api/embeddings',
    hasEmbedding: true,
    lockedModelType: true,
  },
  {
    id: ApiServiceEnum.OPENAI,
    url: 'https://api.openai.com',
    modelType: apiModelTypeOpenAI.value,
    embeddingPath: '/v1/embeddings',
    hasEmbedding: true,
    lockedModelType: true,
  },
  {
    id: ApiServiceEnum.TOGETHER,
    url: 'https://api.together.xyz',
    modelType: apiModelTypeOpenAI.value,
    embeddingPath: '/v1/embeddings',
    hasEmbedding: true,
    lockedModelType: true,
  },
  {
    id: ApiServiceEnum.MISTRAL,
    url: 'https://api.mistral.ai',
    modelType: apiModelTypeOpenAI.value,
    embeddingPath: '/v1/embeddings',
    hasEmbedding: true,
    lockedModelType: true,
  },
  {
    id: ApiServiceEnum.GROQ,
    url: 'https://api.groq.com/openai',
    modelType: apiModelTypeOpenAI.value,
    embeddingPath: '',
    hasEmbedding: false,
    lockedModelType: true,
  },
  {
    id: ApiServiceEnum.STANDARD,
    url: 'https://',
    modelType: apiModelTypeOpenAI.value,
    embeddingPath: '',
    hasEmbedding: false,
    lockedModelType: false,
  },
  {
    id: ApiServiceEnum.ANTHROPIC,
    url: 'https://api.anthropic.com',
    modelType: apiModelTypeOpenAI.value,
    embeddingPath: '',
    hasEmbedding: false,
    lockedModelType: true,
  },
] as const;

export const fileUploadFolder = './uploads/';
export const appName = 'Alpaca WebUI';
