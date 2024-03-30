/* eslint-disable no-unused-vars */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
interface ModelStoreState {
  modelName: string | null;
  embedModelName: string | null;
  updateModelName: (m: string | null) => void;
  updateEmbedModelName: (m: string | null) => void;
}

export const useModelStore = create<ModelStoreState>((set) => ({
  modelName: null,
  embedModelName: null,
  updateModelName: (m: string | null) => set(() => ({ modelName: m })),
  updateEmbedModelName: (m: string | null) => set(() => ({ embedModelName: m })),
}));

interface SettingsStoreState {
  modelVariant: string | null;
  hostname: string | null;
  token: string | null;
  systemPrompt: string | null;
  systemPromptForRag: string | null;
  systemPromptForRagSlim: string | null;
  hasHydrated: boolean;
  setSettings: (modelListVariant: string | null, hostname: string | null, token: string | null) => void;
  setSystemPrompt: (systemPrompt: string | null) => void;
  setSystemPromptForRag: (systemPrompt: string | null) => void;
  setSystemPromptForRagSlim: (systemPrompt: string | null) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const RagSystemPromptVariable = {
  userQuestion: '{{UserQuestion}}',
  documentContent: '{{DocumentContent}}'
} as const;

export const useSettingsStore = create<SettingsStoreState>()(
  persist(
    (set) => ({
      modelVariant: null,
      hostname: null,
      token: null,
      systemPrompt: `Hello i am a AI assistant, how can i help you?`,
      systemPromptForRag: `Instructions: Carefully read and synthesize the information presented in the document section below to answer the user's question. Your response must be derived exclusively from the content found between the "### Begin Document ###" and "### End Document ###" markers. If the information within these markers does not contain sufficient details to answer the question, you must clearly state that an answer cannot be provided based on the available document/data. Aim for a concise, accurate, and relevant response to the user's query.

      User's Question:
      {{UserQuestion}}
      
      Relevant Document Information:
      ### Begin Document
      {{DocumentContent}}
      ### End Document
      
      Answer:`,
      systemPromptForRagSlim: `User's Question:
      ${RagSystemPromptVariable.userQuestion}
      
      Relevant Document Information:
      ### Begin Document ###
      ${RagSystemPromptVariable.documentContent}
      ### End Document ###
      
      Answer:`,
      hasHydrated: false,
      setSettings: (modelVariant, hostname, token) =>
        set(() => ({ modelVariant: modelVariant, hostname: hostname, token: token })),
      setSystemPrompt: (systemPrompt) => set(() => ({ systemPrompt: systemPrompt })),
      setSystemPromptForRag: (systemPrompt) => set(() => ({ systemPromptForRag: systemPrompt })),
      setSystemPromptForRagSlim: (systemPrompt) => set(() => ({ systemPromptForRagSlim: systemPrompt })),
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
