import { ApiService } from '../api-service';
import { ApiServiceEnum } from './data';
import { Provider } from './provider';
import OllamaProvider from './ollama-provider';
import OpenAIProvider from './openai-provider';
import TogetherProvider from './together-provider';
import MistralProvider from './mistral-provider';
import GroqProvider from './groq-provider';
import AnthropicProvider from './anthropic-provider';
import GoogleProvider from './google-provider';
import DeepseekProvider from './deepseek-provider';

export const providerMap: Record<ApiServiceEnum, new (service: ApiService) => Provider> = {
  [ApiServiceEnum.OLLAMA]: OllamaProvider,
  [ApiServiceEnum.OPENAI]: OpenAIProvider,
  [ApiServiceEnum.TOGETHER]: TogetherProvider,
  [ApiServiceEnum.MISTRAL]: MistralProvider,
  [ApiServiceEnum.GROQ]: GroqProvider,
  [ApiServiceEnum.STANDARD]: OpenAIProvider, // <- FIX!
  [ApiServiceEnum.ANTHROPIC]: AnthropicProvider,
  [ApiServiceEnum.GOOGLE]: GoogleProvider,
  [ApiServiceEnum.DEEPSEEK]: DeepseekProvider,
};
