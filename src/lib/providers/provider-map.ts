import { ApiService } from '../api-service';
import { ApiProviderEnum } from './data';
import { type Provider } from './provider';
import OllamaProvider from './ollama-provider';
import OpenAIProvider from './openai-provider';
import TogetherProvider from './together-provider';
import MistralProvider from './mistral-provider';
import GroqProvider from './groq-provider';
import AnthropicProvider from './anthropic-provider';
import GoogleProvider from './google-provider';
import DeepseekProvider from './deepseek-provider';
import OpenRouterProvider from './openrouter-provider';

export const providerMap: Record<ApiProviderEnum, new (service: ApiService) => Provider> = {
  [ApiProviderEnum.OLLAMA]: OllamaProvider,
  [ApiProviderEnum.OPENAI]: OpenAIProvider,
  [ApiProviderEnum.TOGETHER]: TogetherProvider,
  [ApiProviderEnum.MISTRAL]: MistralProvider,
  [ApiProviderEnum.GROQ]: GroqProvider,
  [ApiProviderEnum.ANTHROPIC]: AnthropicProvider,
  [ApiProviderEnum.GOOGLE]: GoogleProvider,
  [ApiProviderEnum.DEEPSEEK]: DeepseekProvider,
  [ApiProviderEnum.OPENROUTER]: OpenRouterProvider,
};
