import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { type TApiSetting } from './types';

export const SystemPromptVariable = {
  userQuestion: '{{UserQuestion}}',
  documentContent: '{{DocumentContent}}',
  chatHistoryInput: '{{ChatHistoryGoesHere}}',
} as const;

// ---- Settings Store ---- //
interface SettingsStoreState {
  services: TApiSetting[];
  setServices: (services: TApiSetting[]) => void;
  systemPrompt: string;
  systemPromptForRag: string;
  systemPromptForRagSlim: string;
  systemPromptForChatTitle: string;
  embedModel: string | null;
  hasHydrated: boolean;
  setSystemPrompt: (systemPrompt: string) => void;
  setSystemPromptForRag: (systemPrompt: string) => void;
  setSystemPromptForRagSlim: (systemPrompt: string) => void;
  setSystemPromptForChatTitle: (systemPrompt: string) => void;
  setEmbedModel: (model: string | null) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const useSettingsStore = create<SettingsStoreState>()(
  persist(
    (set) => ({
      services: [],
      setServices: (services: TApiSetting[]) => set(() => ({ services: services })),
      systemPrompt: `Hello i am a AI assistant, how can i help you?`,
      systemPromptForRag: `Instructions: Carefully read and synthesize the information presented in the document section below to answer the user's question. Your response must be derived exclusively from the content found between the "### Begin Document ###" and "### End Document ###" markers. If the information within these markers does not contain sufficient details to answer the question, you must clearly state that an answer cannot be provided based on the available document/data. Aim for a concise, accurate, and relevant response to the user's query.

User's Question:
${SystemPromptVariable.userQuestion}

Relevant Document Information:
### Begin Document
${SystemPromptVariable.documentContent}
### End Document

Answer:`,
      systemPromptForRagSlim: `User's Question:
${SystemPromptVariable.userQuestion}

Relevant Document Information:
### Begin Document ###
${SystemPromptVariable.documentContent}
### End Document ###

Answer:`,
      systemPromptForChatTitle: `### Task:
Generate a concise, 3-8 word title summarizing the chat history.
### Guidelines:
- The title should clearly represent the main theme or subject of the conversation.
- Avoid quotation marks or special formatting.
- Write the title in the chat's primary language; default to English if multilingual.
- Prioritize accuracy over excessive creativity; keep it clear and simple.
### Output:
JSON format: { "title": "Chat history concise title goes here" }
### Examples:
- { "title": "Understanding Current Stock Market Trends" },
- { "title": "Most delicious Chewy Chocolate Chip Cookies Recipe Ever" },
- { "title": "Digital Transformation of Music through Streaming" },
- { "title": "Strategies for Staying Productive While Working Remotely" },
- { "title": "Impact of Machine Learning in Modern Healthcare Settings" },
- { "title": "Innovative Approaches to Video Game Development" }
### Chat History:
<chat_history>
${SystemPromptVariable.chatHistoryInput}
</chat_history>`,
      embedModel: null,
      hasHydrated: false,
      setSystemPrompt: (systemPrompt) => set(() => ({ systemPrompt: systemPrompt })),
      setSystemPromptForRag: (systemPrompt) => set(() => ({ systemPromptForRag: systemPrompt })),
      setSystemPromptForRagSlim: (systemPrompt) => set(() => ({ systemPromptForRagSlim: systemPrompt })),
      setSystemPromptForChatTitle: (systemPrompt) => set(() => ({ systemPromptForChatTitle: systemPrompt })),
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
