export const apiServiceModelTypes = [
  { label: 'Ollama - /api/tags', value: 'ollama' },
  { label: 'OpenAI - /v1/models', value: 'openai' },
  { label: 'Manual', value: 'manual' },
] as const;

export const apiServices = [
  { label: 'Ollama', url: 'http://localhost:11434', modelType: 'ollama', hasEmbedding: true },
  { label: 'OpenAI', url: 'https://api.openai.com', modelType: 'openai', hasEmbedding: true },
  { label: 'Together.ai', url: 'https://api.together.xyz', modelType: 'openai', hasEmbedding: true },
  { label: 'Mistral.ai', url: 'https://api.mistral.ai', modelType: 'openai', hasEmbedding: true },
] as const;