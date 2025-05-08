import { z } from 'zod';
import { formatBytes } from './utils';
import { v7 as uuidv7 } from 'uuid';

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

const ContentImageUrlSchema = z.object({
  url: z.string(),
});

const ContentTextSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
});
export type TContentText = z.infer<typeof ContentTextSchema>;

const ContentImageMetaSchema = z.object({
  filename: z.string(),
  size: z.string(),
});

const ContentImageSchema = z.object({
  type: z.literal('image_url'),
  image_url: ContentImageUrlSchema,
  meta: ContentImageMetaSchema.nullish(),
});
export type TContentImage = z.infer<typeof ContentImageSchema>;

const contentItemSchema = z.discriminatedUnion('type', [ContentTextSchema, ContentImageSchema]);

export type TContentItem = z.infer<typeof contentItemSchema>;

const contentUnionSchema = z.union([z.string().nullable(), z.array(contentItemSchema)]);
export type TContentUnion = z.infer<typeof contentUnionSchema>;

const MessageSchema = z.object({
  role: ChatRoleSchema.default(ChatRole.ASSISTANT),
  content: contentUnionSchema,
  reasoning_content: z.string().optional().nullable(),
  reasoning: z.string().optional().nullable(),
});
export type TChatMessage = z.infer<typeof MessageSchema>;

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
export type TChatCompletionResponse = z.infer<typeof ChatCompletionSchema>;

const ChatCompletionRequestSchema = z.object({
  model: z.string(),
  messages: z.array(MessageSchema),
  stream: z.boolean(),
});
export type TChatCompletionRequest = z.infer<typeof ChatCompletionRequestSchema>;

const OpenAIModelResponseSchema = z.object({
  id: z.string(),
  object: z.string(),
  created: z.number().optional(),
  owned_by: z.string().optional(),
});
export type TOpenAIModelResponseSchema = z.infer<typeof OpenAIModelResponseSchema>;
export const OpenAIModelsResponseSchema = z.array(OpenAIModelResponseSchema);
export type TModelsResponseSchema = z.infer<typeof OpenAIModelsResponseSchema>;

const ModelSchema = z.object({
  id: z.string(),
  object: z.string(),
  created: z.number(),
  type: z.string().optional(),
  embedding: z.boolean(),
});
export type TModelSchema = z.infer<typeof ModelSchema>;

export const CreateImageRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required!'),
  model: z.string(),
  n: z.number().default(1),
  quality: z.string(),
  size: z.string(),
  style: z.string().optional(),
  user: z.string().optional(),
});
export type TCreateImageRequest = z.infer<typeof CreateImageRequestSchema>;

const CreateImageDataSchema = z.object({
  url: z.string().optional(),
  b64_json: z.string().optional(),
  revised_prompt: z.string().optional(),
});
export type TCreateImageData = z.infer<typeof CreateImageDataSchema>;

const CreateImageResponseSchema = z.object({
  created: z.number(),
  data: z.array(CreateImageDataSchema),
  error: z.boolean().default(false),
});
export type TCreateImageResponse = z.infer<typeof CreateImageResponseSchema>;

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

export const CustomContextSchema = z.object({
  contextId: z.string(),
  name: z.string(),
});
export type TCustomContext = z.infer<typeof CustomContextSchema>;

const CustomChatMessageSchema = z.object({
  id: z.string().default(() => uuidv7()),
  role: ChatRoleSchema.default(ChatRole.ASSISTANT),
  content: contentUnionSchema,
  provider: CustomProviderSchema.default(defaultProvider),
  streamComplete: z.boolean().optional().default(true),
  isReasoning: z.boolean().optional().default(false),
  cancelled: z.boolean().optional().default(false),
  durationInMs: z.number().optional().default(0),
  context: CustomContextSchema.optional(),
});
export type TCustomChatMessage = z.infer<typeof CustomChatMessageSchema>;

const CustomCreateImageDataSchema = z.object({
  id: z.string().default(() => uuidv7()),
  url: z.string().optional(),
  b64_json: z.string().optional(),
  revised_prompt: z.string().optional(),
  provider: CustomProviderSchema.default(defaultProvider),
  streamComplete: z.boolean().optional().default(true),
  isReasoning: z.boolean().optional().default(false),
  cancelled: z.boolean().optional().default(false),
  durationInMs: z.number().optional().default(0),
  context: CustomContextSchema.optional(),
});
export type TCustomCreateImageData = z.infer<typeof CustomCreateImageDataSchema>;

export const CustomMessageSchema = z.union([CustomChatMessageSchema, CustomCreateImageDataSchema]);
export const CustomMessagesSchema = z.array(CustomMessageSchema);
export type TCustomMessage = z.infer<typeof CustomMessageSchema>;

export const isImage = (item: TCustomChatMessage | TCustomCreateImageData): item is TCustomCreateImageData => {
  return 'url' in item || 'b64_json' in item;
};

export const isChat = (item: TCustomChatMessage | TCustomCreateImageData): item is TCustomChatMessage => {
  return 'content' in item;
};
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

export const ApiSettingsSchema = z.object({
  serviceId: z.string().readonly(),
  hasEmbedding: z.boolean().readonly(),
  embeddingPath: z.string().readonly(),
  lockedModelType: z.boolean().readonly(),
  url: z.string().regex(urlPattern, "URL must start with 'http://' or 'https://' followed by a domain name."), //  without any trailing path.
  apiType: z.string({ required_error: 'Please select the api type.' }).min(2, 'Please select the api type.'),
  apiKey: z.union([z.string().min(5, 'API Key must be at least 5 characters long.'), z.literal('')]).optional(),
});

export type TApiSetting = z.infer<typeof ApiSettingsSchema>;

export const SettingsFormSchema = z.object({
  services: z.array(ApiSettingsSchema),
});

export type TSettingsFormSchema = z.infer<typeof SettingsFormSchema>;

export type OpenPopovers = {
  [key: string]: boolean;
};
