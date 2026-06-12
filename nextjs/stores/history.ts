import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface HistoryEntry {
  image: string;
  seed: number;
  prompt: string;
}

interface HistoryStore {
  entries: HistoryEntry[];
  addEntry: (entry: HistoryEntry) => void;
}

export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set) => ({
      entries: [],
      addEntry: (entry) =>
        set((state) => ({ entries: [entry, ...state.entries] })),
    }),
    { name: "imagegen-history" },
  ),
);
