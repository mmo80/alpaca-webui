export type ApiProviderModel = {
  id: string;
  url: string;
  apiType: string;
  embeddingPath: string;
  supportsEmbedding: boolean;
};

export enum ApiTypeEnum {
  OLLAMA = 'Ollama',
  OPENAI = 'OpenAI',
  GOOGLE = 'Google',
}
export const apiTypes = [{ value: ApiTypeEnum.OLLAMA }, { value: ApiTypeEnum.OPENAI }, { value: ApiTypeEnum.GOOGLE }];

export enum ApiProviderEnum {
  OLLAMA = 'Ollama',
  OPENAI = 'OpenAI',
  TOGETHER = 'Together.xyz',
  MISTRAL = 'Mistral.ai',
  GROQ = 'Groq.com',
  ANTHROPIC = 'Anthropic',
  GOOGLE = 'Google',
  DEEPSEEK = 'DeepSeek',
  OPENROUTER = 'OpenRouter',
}

export const preDefinedApiProviders: ApiProviderModel[] = [
  {
    id: ApiProviderEnum.OLLAMA,
    url: 'http://localhost:11434',
    apiType: ApiTypeEnum.OLLAMA,
    embeddingPath: '/api/embeddings',
    supportsEmbedding: true,
  },
  {
    id: ApiProviderEnum.OPENAI,
    url: 'https://api.openai.com',
    apiType: ApiTypeEnum.OPENAI,
    embeddingPath: '/v1/embeddings',
    supportsEmbedding: true,
  },
  {
    id: ApiProviderEnum.TOGETHER,
    url: 'https://api.together.xyz',
    apiType: ApiTypeEnum.OPENAI,
    embeddingPath: '/v1/embeddings',
    supportsEmbedding: true,
  },
  {
    id: ApiProviderEnum.MISTRAL,
    url: 'https://api.mistral.ai',
    apiType: ApiTypeEnum.OPENAI,
    embeddingPath: '/v1/embeddings',
    supportsEmbedding: true,
  },
  {
    id: ApiProviderEnum.GROQ,
    url: 'https://api.groq.com/openai',
    apiType: ApiTypeEnum.OPENAI,
    embeddingPath: '',
    supportsEmbedding: false,
  },
  {
    id: ApiProviderEnum.ANTHROPIC,
    url: 'https://api.anthropic.com',
    apiType: ApiTypeEnum.OPENAI,
    embeddingPath: '',
    supportsEmbedding: false,
  },
  {
    id: ApiProviderEnum.GOOGLE,
    url: 'https://generativelanguage.googleapis.com',
    apiType: ApiTypeEnum.GOOGLE,
    embeddingPath: '',
    supportsEmbedding: true,
  },
  {
    id: ApiProviderEnum.DEEPSEEK,
    url: 'https://api.deepseek.com',
    apiType: ApiTypeEnum.OPENAI,
    embeddingPath: '',
    supportsEmbedding: false,
  },
  {
    id: ApiProviderEnum.OPENROUTER,
    url: 'https://openrouter.ai',
    apiType: ApiTypeEnum.OPENAI,
    embeddingPath: '',
    supportsEmbedding: false,
  },
] as const;

export const fileUploadFolder = './uploads/';
export const appName = 'Alpaca WebUI';
