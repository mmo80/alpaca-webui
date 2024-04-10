import { create } from 'zustand';
import { TApiSettingsSchema } from './types';

// ---- Model Store ---- //
interface ModelStoreState {
  selectedService: TApiSettingsSchema | null;
  selectedModel: string | null;
  selectedEmbedService: TApiSettingsSchema | null;
  selectedEmbedModel: string | null;
  setService: (service: TApiSettingsSchema | null | undefined) => void;
  setModel: (model: string | null) => void;
  setEmbedService: (service: TApiSettingsSchema | null | undefined) => void;
  setEmbedModel: (model: string | null) => void;
}

export const useModelStore = create<ModelStoreState>((set) => ({
  selectedService: null,
  selectedModel: null,
  selectedEmbedService: null,
  selectedEmbedModel: null,
  setService: (service: TApiSettingsSchema | null | undefined) => set(() => ({ selectedService: service })),
  setModel: (model: string | null) => set(() => ({ selectedModel: model })),
  setEmbedService: (service: TApiSettingsSchema | null | undefined) => set(() => ({ selectedEmbedService: service })),
  setEmbedModel: (model: string | null) => set(() => ({ selectedEmbedModel: model })),
}));
