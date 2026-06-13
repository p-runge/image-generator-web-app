import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface HistoryEntry {
  image: string;
  seed: number;
  prompt: string;
  negative_prompt: string;
  num_inference_steps: number;
  guidance_scale: number;
  width: number;
  height: number;
}

interface HistoryStore {
  entries: HistoryEntry[];
  addEntry: (entry: HistoryEntry) => void;
  removeEntry: (index: number) => void;
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set) => ({
      entries: [],
      addEntry: (entry) =>
        set((state) => ({ entries: [entry, ...state.entries] })),
      removeEntry: (index) =>
        set((state) => ({ entries: state.entries.filter((_, i) => i !== index) })),
      clearHistory: () => set({ entries: [] }),
    }),
    { name: "imagegen-history" },
  ),
);
