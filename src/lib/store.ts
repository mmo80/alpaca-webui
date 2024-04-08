/* eslint-disable no-unused-vars */
import { TApiSettingsSchema } from '@/app/settings/page';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
interface ModelStoreState {
  selectedModel: string | null;
  selectedEmbedModel: string | null;
  setModel: (model: string | null) => void;
  setEmbedModel: (model: string | null) => void;
}

export const useModelStore = create<ModelStoreState>((set) => ({
  selectedModel: null,
  selectedEmbedModel: null,
  setModel: (model: string | null) => set(() => ({ selectedModel: model })),
  setEmbedModel: (model: string | null) => set(() => ({ selectedEmbedModel: model })),
}));

interface SettingsStoreState {
  services: TApiSettingsSchema[];
  setServices: (services: TApiSettingsSchema[]) => void;
  modelVariant: string | null;
  baseUrl: string | null;
  token: string | null;
  systemPrompt: string;
  systemPromptForRag: string;
  systemPromptForRagSlim: string;
  embedModel: string | null;
  hasHydrated: boolean;
  setSettings: (modelListVariant: string | null, baseUrl: string | null, token: string | undefined) => void;
  setSystemPrompt: (systemPrompt: string) => void;
  setSystemPromptForRag: (systemPrompt: string) => void;
  setSystemPromptForRagSlim: (systemPrompt: string) => void;
  setEmbedModel: (model: string | null) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const RagSystemPromptVariable = {
  userQuestion: '{{UserQuestion}}',
  documentContent: '{{DocumentContent}}',
} as const;

export const useSettingsStore = create<SettingsStoreState>()(
  persist(
    (set) => ({
      services: [],
      setServices: (services: TApiSettingsSchema[]) => set(() => ({ services: services })),
      modelVariant: null,
      baseUrl: null,
      token: null,
      systemPrompt: `Hello i am a AI assistant, how can i help you?`,
      systemPromptForRag: `Instructions: Carefully read and synthesize the information presented in the document section below to answer the user's question. Your response must be derived exclusively from the content found between the "### Begin Document ###" and "### End Document ###" markers. If the information within these markers does not contain sufficient details to answer the question, you must clearly state that an answer cannot be provided based on the available document/data. Aim for a concise, accurate, and relevant response to the user's query.

User's Question:
${RagSystemPromptVariable.userQuestion}

Relevant Document Information:
### Begin Document
${RagSystemPromptVariable.documentContent}
### End Document

Answer:`,
      systemPromptForRagSlim: `User's Question:
${RagSystemPromptVariable.userQuestion}

Relevant Document Information:
### Begin Document ###
${RagSystemPromptVariable.documentContent}
### End Document ###

Answer:`,
      embedModel: null,
      hasHydrated: false,
      setSettings: (modelVariant, baseUrl, token) =>
        set(() => ({ modelVariant: modelVariant, baseUrl: baseUrl, token: token })),
      setSystemPrompt: (systemPrompt) => set(() => ({ systemPrompt: systemPrompt })),
      setSystemPromptForRag: (systemPrompt) => set(() => ({ systemPromptForRag: systemPrompt })),
      setSystemPromptForRagSlim: (systemPrompt) => set(() => ({ systemPromptForRagSlim: systemPrompt })),
      setEmbedModel: (model) => set(() => ({ embedModel: model })),
      setHasHydrated: (state) => {
        set({
          hasHydrated: state,
        });
      },
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state == null) return;
        state.setHasHydrated(true);
      },
    }
  )
);
