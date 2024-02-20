import { get } from "http";
import { create } from "zustand";

interface OllamaState {
  model: string | null;
  updateModel: (m: string | null) => void;
}

export const useOllamaStore = create<OllamaState>((set) => ({
  model: null,
  updateModel: (m: string | null) => set(() => ({ model: m })),
}));
