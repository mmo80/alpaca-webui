import { create } from 'zustand';
import { type TApiSetting } from './types';

// ---- Model Store ---- //
interface ModelStoreState {
  selectedService: TApiSetting | undefined;
  selectedModel: string | undefined;
  selectedEmbedService: TApiSetting | undefined;
  selectedEmbedModel: string | undefined;
  setService: (service: TApiSetting | undefined) => void;
  setModel: (model: string | undefined) => void;
  setEmbedService: (service: TApiSetting | undefined) => void;
  setEmbedModel: (model: string | undefined) => void;
}

export const useModelStore = create<ModelStoreState>((set) => ({
  selectedService: undefined,
  selectedModel: undefined,
  selectedEmbedService: undefined,
  selectedEmbedModel: undefined,
  setService: (service: TApiSetting | undefined) => set(() => ({ selectedService: service })),
  setModel: (model: string | undefined) => set(() => ({ selectedModel: model })),
  setEmbedService: (service: TApiSetting | undefined) => set(() => ({ selectedEmbedService: service })),
  setEmbedModel: (model: string | undefined) => set(() => ({ selectedEmbedModel: model })),
}));
