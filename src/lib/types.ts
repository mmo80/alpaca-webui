import { z } from "zod";

export enum ChatRole {
  USER = "user",
  SYSTEM = "system",
  ASSISTANT = "assistant",
}

const ChatRoleSchema = z.nativeEnum(ChatRole);

const ChatMessageSchema = z.object({
  role: ChatRoleSchema,
  content: z.string(),
});

// url: https://stackoverflow.com/a/18650828
function formatBytes(a: number, b:number = 2) {
  if (!+a) return "0 Bytes";
  const c = 0 > b ? 0 : b,
    d = Math.floor(Math.log(a) / Math.log(1024));
  return `${parseFloat((a / Math.pow(1024, d)).toFixed(c))} ${
    ["B", "kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"][d]
  }`;
}

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

export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type OllamaModel = z.infer<typeof OllamaModelSchema>;
export type OllamaTag = z.infer<typeof OllamaTagSchema>;

export type OllamaChat = {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
};
