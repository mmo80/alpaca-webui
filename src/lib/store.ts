import { create } from "zustand";
import { OllamaModel } from "@/lib/types";

interface ModelStoreState {
  modelName: string | null;
  model: OllamaModel | null;
  updateModelName: (m: string | null) => void;
  updateModel: (m: OllamaModel | null) => void;
}

export const useModelStore = create<ModelStoreState>((set) => ({
  modelName: null,
  model: null,
  updateModelName: (m: string | null) => set(() => ({ modelName: m })),
  updateModel: (m: OllamaModel | null) => set(() => ({ model: m })),
}));
