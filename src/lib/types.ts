import { z } from 'zod';
import { formatBytes } from './utils';

export enum ChatRole {
  USER = 'user',
  SYSTEM = 'system',
  ASSISTANT = 'assistant',
}

const ChatRoleSchema = z.nativeEnum(ChatRole);

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

// OpenAI API Models
const UsageSchema = z.object({
  prompt_tokens: z.number(),
  completion_tokens: z.number(),
  total_tokens: z.number(),
});

const MessageSchema = z.object({
  role: ChatRoleSchema.default(ChatRole.ASSISTANT),
  content: z.string(),
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

export type ChatCompletionResponse = z.infer<typeof ChatCompletionSchema>;
export type ChatMessage = z.infer<typeof MessageSchema>;

const ChatCompletionRequestSchema = z.object({
  model: z.string(),
  messages: z.array(MessageSchema),
  stream: z.boolean(),
});

export type ChatCompletionnRequest = z.infer<typeof ChatCompletionRequestSchema>;

const ModelResponseSchema = z.object({
  id: z.string(),
  object: z.string(),
  created: z.number(),
});

export const ModelsResponseSchema = z.array(ModelResponseSchema);

export type TModelsResponseSchema = z.infer<typeof ModelsResponseSchema>;
export type TModelResponseSchema = z.infer<typeof ModelResponseSchema>;

export const EmbedDocumentResponseSchema = z.object({
  success: z.boolean(),
  errorMessage: z.string().nullable(),
});

export type EmbedDocumentResponse = z.infer<typeof EmbedDocumentResponseSchema>;