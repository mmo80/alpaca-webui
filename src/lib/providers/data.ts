export type ApiServiceModel = {
  id: string;
  url: string;
  apiType: string;
  embeddingPath: string;
  hasEmbedding: boolean;
  lockedModelType: boolean;
};

export enum ApiTypeEnum {
  OLLAMA = 'Ollama',
  OPENAI = 'OpenAI',
  GOOGLE = 'Google',
}
export const apiTypes = [{ value: ApiTypeEnum.OLLAMA }, { value: ApiTypeEnum.OPENAI }, { value: ApiTypeEnum.GOOGLE }];

export enum ApiServiceEnum {
  OLLAMA = 'Ollama',
  OPENAI = 'OpenAI',
  TOGETHER = 'Together.xyz',
  MISTRAL = 'Mistral.ai',
  GROQ = 'Groq.com',
  STANDARD = 'Standard',
  ANTHROPIC = 'Anthropic',
  GOOGLE = 'Google',
  DEEPSEEK = 'DeepSeek',
  OPENROUTER = 'OpenRouter',
}

export const preDefinedApiServices: ApiServiceModel[] = [
  {
    id: ApiServiceEnum.OLLAMA,
    url: 'http://localhost:11434',
    apiType: ApiTypeEnum.OLLAMA,
    embeddingPath: '/api/embeddings',
    hasEmbedding: true,
    lockedModelType: true,
  },
  {
    id: ApiServiceEnum.OPENAI,
    url: 'https://api.openai.com',
    apiType: ApiTypeEnum.OPENAI,
    embeddingPath: '/v1/embeddings',
    hasEmbedding: true,
    lockedModelType: true,
  },
  {
    id: ApiServiceEnum.TOGETHER,
    url: 'https://api.together.xyz',
    apiType: ApiTypeEnum.OPENAI,
    embeddingPath: '/v1/embeddings',
    hasEmbedding: true,
    lockedModelType: true,
  },
  {
    id: ApiServiceEnum.MISTRAL,
    url: 'https://api.mistral.ai',
    apiType: ApiTypeEnum.OPENAI,
    embeddingPath: '/v1/embeddings',
    hasEmbedding: true,
    lockedModelType: true,
  },
  {
    id: ApiServiceEnum.GROQ,
    url: 'https://api.groq.com/openai',
    apiType: ApiTypeEnum.OPENAI,
    embeddingPath: '',
    hasEmbedding: false,
    lockedModelType: true,
  },
  {
    id: ApiServiceEnum.STANDARD,
    url: 'https://',
    apiType: ApiTypeEnum.OPENAI,
    embeddingPath: '',
    hasEmbedding: false,
    lockedModelType: false,
  },
  {
    id: ApiServiceEnum.ANTHROPIC,
    url: 'https://api.anthropic.com',
    apiType: ApiTypeEnum.OPENAI,
    embeddingPath: '',
    hasEmbedding: false,
    lockedModelType: true,
  },
  {
    id: ApiServiceEnum.GOOGLE,
    url: 'https://generativelanguage.googleapis.com',
    apiType: ApiTypeEnum.GOOGLE,
    embeddingPath: '',
    hasEmbedding: true,
    lockedModelType: true,
  },
  {
    id: ApiServiceEnum.DEEPSEEK,
    url: 'https://api.deepseek.com',
    apiType: ApiTypeEnum.OPENAI,
    embeddingPath: '',
    hasEmbedding: false,
    lockedModelType: true,
  },
  {
    id: ApiServiceEnum.OPENROUTER,
    url: 'https://openrouter.ai',
    apiType: ApiTypeEnum.OPENAI,
    embeddingPath: '',
    hasEmbedding: false,
    lockedModelType: true,
  },
] as const;

export const fileUploadFolder = './uploads/';
export const appName = 'Alpaca WebUI';
