import { create } from 'zustand';
import type { TProviderSettings } from './types';

// ---- Model Store ---- //
interface ModelStoreState {
  selectedProvider: TProviderSettings | null;
  selectedModel: string | null;
  selectedEmbedProvider: TProviderSettings | null;
  selectedEmbedModel: string | null;
  setProvider: (provider: TProviderSettings | null) => void;
  setModel: (model: string | null) => void;
  setEmbedProvider: (provider: TProviderSettings | null) => void;
  setEmbedModel: (model: string | null) => void;
}

export const useModelStore = create<ModelStoreState>((set) => ({
  selectedProvider: null,
  selectedModel: null,
  selectedEmbedProvider: null,
  selectedEmbedModel: null,
  setProvider: (provider: TProviderSettings | null) => set(() => ({ selectedProvider: provider })),
  setModel: (model: string | null) => set(() => ({ selectedModel: model })),
  setEmbedProvider: (provider: TProviderSettings | null) => set(() => ({ selectedEmbedProvider: provider })),
  setEmbedModel: (model: string | null) => set(() => ({ selectedEmbedModel: model })),
}));
