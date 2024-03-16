import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ModelStoreState {
  modelName: string | null;
  updateModelName: (m: string | null) => void;
}

export const useModelStore = create<ModelStoreState>((set) => ({
  modelName: null,
  updateModelName: (m: string | null) => set(() => ({ modelName: m })),
}));

interface SettingsStoreState {
  modelVariant: string | null;
  hostname: string | null;
  token: string | null;
  systemPrompt: string | null;
  setSettings: (modelListVariant: string | null, hostname: string | null, token: string | null) => void;
  setSystemPrompt: (systemPrompt: string | null) => void;
}

export const useSettingsStore = create<SettingsStoreState>()(
  persist(
    (set) => ({
      modelVariant: null,
      hostname: null,
      token: null,
      systemPrompt: 'Hello i am a AI assistant, how can i help you?',
      setSettings: (modelVariant, hostname, token) =>
        set(() => ({ modelVariant: modelVariant, hostname: hostname, token: token })),
      setSystemPrompt: (systemPrompt) => 
        set(() => ({ systemPrompt: systemPrompt })),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => localStorage)
    }
  )
);