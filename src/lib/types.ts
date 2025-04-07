import { z } from 'zod';
import { formatBytes } from './utils';

// ----- Common API Models ----- //
export enum ChatRole {
  USER = 'user',
  SYSTEM = 'system',
  ASSISTANT = 'assistant',
}
const ChatRoleSchema = z.nativeEnum(ChatRole);

// ----- Ollama API Models ----- //
const OllamaModelSchema = z
  .object({
    name: z.string(),
    model: z.string(),
    modified_at: z.string(),
    size: z.number(),
    digest: z.string(),
    details: z.object({
      parent_model: z.string(),
      format: z.string(),
      family: z.string(),
      families: z.nullable(z.array(z.string())),
      parameter_size: z.string(),
      quantization_level: z.string(),
    }),
  })
  .transform((values) => ({
    ...values,
    get sizeInGB() {
      return formatBytes(values.size);
    },
  }));

export const OllamaTagSchema = z.object({
  models: z.array(OllamaModelSchema),
});

export type OllamaModel = z.infer<typeof OllamaModelSchema>;
export type OllamaTag = z.infer<typeof OllamaTagSchema>;

// ----- OpenAI API Models ----- //
const UsageSchema = z.object({
  prompt_tokens: z.number(),
  completion_tokens: z.number(),
  total_tokens: z.number(),
});

const MessageSchema = z.object({
  role: ChatRoleSchema.default(ChatRole.ASSISTANT),
  content: z.string(),
  reasoning_content: z.string().optional().nullable(),
});

const ChoiceSchema = z.object({
  index: z.number(),
  delta: MessageSchema,
  finish_reason: z.string().or(z.nullable(z.string())),
});

const ChatCompletionSchema = z.object({
  id: z.string(),
  object: z.string(),
  created: z.number(),
  model: z.string(),
  system_fingerprint: z.string(),
  choices: z.array(ChoiceSchema),
  usage: UsageSchema.or(z.nullable(UsageSchema)),
});

const ChatCompletionRequestSchema = z.object({
  model: z.string(),
  messages: z.array(MessageSchema),
  stream: z.boolean(),
});

const OpenAIModelResponseSchema = z.object({
  id: z.string(),
  object: z.string(),
  created: z.number().optional(),
  type: z.string().optional(),
});

const ModelSchema = z.object({
  id: z.string(),
  object: z.string(),
  created: z.number(),
  type: z.string().optional(),
  embedding: z.boolean(),
});

export const CreateImageRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required!'),
  model: z.string(),
  n: z.number().default(1),
  quality: z.string().default('standard'),
  size: z.string().default('1024x1024'),
  style: z.string().default('vivid'),
  user: z.string().optional(),
});

const CreateImageDataSchema = z.object({
  url: z.string(),
  b64_json: z.string().optional(),
  revised_prompt: z.string(),
});

const CreateImageResponseSchema = z.object({
  created: z.number(),
  data: z.array(CreateImageDataSchema),
});

export type TCreateImageResponse = z.infer<typeof CreateImageResponseSchema>;
export type TCreateImageRequest = z.infer<typeof CreateImageRequestSchema>;
export type TCreateImageData = z.infer<typeof CreateImageDataSchema>;

export const OpenAIModelsResponseSchema = z.array(OpenAIModelResponseSchema);

export type TChatMessage = z.infer<typeof MessageSchema>;
export type TChatCompletionResponse = z.infer<typeof ChatCompletionSchema>;
export type TChatCompletionRequest = z.infer<typeof ChatCompletionRequestSchema>;
export type TModelsResponseSchema = z.infer<typeof OpenAIModelsResponseSchema>;
export type TOpenAIModelResponseSchema = z.infer<typeof OpenAIModelResponseSchema>;

export type TModelSchema = z.infer<typeof ModelSchema>;
export type TMessage = TChatMessage | TCreateImageData;

// CUSTOM :: START
const CustomProviderSchema = z.object({
  provider: z.string(),
  model: z.string(),
});
export type TCustomProviderSchema = z.infer<typeof CustomProviderSchema>;

export const defaultProvider = {
  provider: '',
  model: '',
} as TCustomProviderSchema;

const CustomChatMessageSchema = z.object({
  role: ChatRoleSchema.default(ChatRole.ASSISTANT),
  content: z.string(),
  reasoning_content: z.string().optional().nullable(),
  provider: CustomProviderSchema.default(defaultProvider),
});
export type TCustomChatMessage = z.infer<typeof CustomChatMessageSchema>;

const CustomCreateImageDataSchema = z.object({
  url: z.string(),
  b64_json: z.string().optional(),
  revised_prompt: z.string(),
  provider: CustomProviderSchema.default(defaultProvider),
});
export type TCustomCreateImageData = z.infer<typeof CustomCreateImageDataSchema>;

export type TCustomMessage = TCustomChatMessage | TCustomCreateImageData;
// CUSTOM :: END

// ----- Anthropic API Models ----- //
const AnthropicModelResponseSchema = z.object({
  type: z.string(),
  id: z.string(),
  display_name: z.string(),
  created_at: z.string().optional(),
});

export const AnthropicModelsResponseSchema = z.array(AnthropicModelResponseSchema);
export type TAnthropicModelResponseSchema = z.infer<typeof AnthropicModelResponseSchema>;

const LocalCompletionsRequestSchema = z.object({
  model: z.string(),
  messages: z.array(MessageSchema),
  apiKey: z.string(),
  baseUrl: z.string(),
});

export type TLocalCompletionsRequest = z.infer<typeof LocalCompletionsRequestSchema>;

// ----- Google API Models ----- //
const GoogleModelResponseSchema = z.object({
  name: z.string(),
  version: z.string(),
  displayName: z.string(),
  description: z.string(),
  inputTokenLimit: z.number(),
  outputTokenLimit: z.number(),
  supportedGenerationMethods: z.array(z.string()).default([]),
  temperature: z.number().optional(),
  topP: z.number().optional(),
  topK: z.number().optional(),
  maxTemperature: z.number().optional(),
});

export const GoogleModelsResponseSchema = z.array(GoogleModelResponseSchema);
export type TGoogleModelResponseSchema = z.infer<typeof GoogleModelResponseSchema>;

const GooglePartSchema = z.object({
  text: z.string(),
});

const GoogleContentSchema = z.object({
  role: z.string(),
  parts: z.array(GooglePartSchema),
});

const GoogleCandidateSchema = z.object({
  content: GoogleContentSchema,
});

const GoogleChatCompletionResponseSchema = z.object({
  candidates: z.array(GoogleCandidateSchema),
  finishReason: z.string().optional(),
});

const GoogleChatCompletionRequestSchema = z.object({
  contents: z.array(GoogleContentSchema),
  finishReason: z.string().optional(),
});

export type TGoogleChatCompletionRequestSchema = z.infer<typeof GoogleChatCompletionRequestSchema>;
export type TGoogleChatCompletionResponseSchema = z.infer<typeof GoogleChatCompletionResponseSchema>;

// ----- OpenRouter ----- //
const OpenRouterModelResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  created: z.number().optional(),
  description: z.string().optional(),
});
export const OpenRouterModelsResponseSchema = z.array(OpenRouterModelResponseSchema);

// ----- Custom Models ----- //
export const EmbedDocumentResponseSchema = z.object({
  success: z.boolean(),
  errorMessage: z.string().nullable(),
});

export type TEmbedDocumentResponse = z.infer<typeof EmbedDocumentResponseSchema>;

const urlPattern = /^(https?:\/\/)(localhost|[\w-]+(\.[\w-]+)+)(:\d+)?(\/.*)?$/;

const ApiSettingsSchema = z.object({
  serviceId: z.string().readonly(),
  hasEmbedding: z.boolean().readonly(),
  embeddingPath: z.string().readonly(),
  lockedModelType: z.boolean().readonly(),
  url: z.string().regex(urlPattern, "URL must start with 'http://' or 'https://' followed by a domain name."), //  without any trailing path.
  apiType: z.string({ required_error: 'Please select the api type.' }).min(2, 'Please select the api type.'),
  apiKey: z.union([z.string().min(5, 'API Key must be at least 5 characters long.'), z.literal('')]).optional(),
});

export type TApiSettingsSchema = z.infer<typeof ApiSettingsSchema>;

export const SettingsFormSchema = z.object({
  services: z.array(ApiSettingsSchema),
});

export type TSettingsFormSchema = z.infer<typeof SettingsFormSchema>;

export type OpenPopovers = {
  [key: string]: boolean;
};
