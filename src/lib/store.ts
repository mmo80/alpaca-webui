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
  modelListVariant: string | null;
  hostname: string | null;
  token: string | null;
  setValues: (modelListVariant: string | null, hostname: string | null, token: string | null) => void;
}

export const useSettingsStore = create<SettingsStoreState>()(
  persist(
    (set) => ({
      modelListVariant: null,
      hostname: null,
      token: null,
      setValues: (modelListVariant, hostname, token) =>
        set(() => ({ modelListVariant: modelListVariant, hostname: hostname, token: token })),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => sessionStorage)
    }
  )
);
