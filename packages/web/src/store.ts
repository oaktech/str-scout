import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Page } from './types';

interface ScoutStore {
  // Navigation
  page: Page;
  setPage: (page: Page) => void;

  // Comparison selection
  compareIds: number[];
  toggleCompare: (id: number) => void;
  clearCompare: () => void;

  // Toast
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  clearToast: () => void;
}

export const useStore = create<ScoutStore>()(
  persist(
    (set) => ({
      page: { name: 'dashboard' },
      setPage: (page) => set({ page }),

      compareIds: [],
      toggleCompare: (id) =>
        set((state) => ({
          compareIds: state.compareIds.includes(id)
            ? state.compareIds.filter((i) => i !== id)
            : state.compareIds.length < 3
              ? [...state.compareIds, id]
              : state.compareIds,
        })),
      clearCompare: () => set({ compareIds: [] }),

      toast: null,
      showToast: (message, type = 'info') => {
        set({ toast: { message, type } });
        setTimeout(() => set({ toast: null }), 4000);
      },
      clearToast: () => set({ toast: null }),
    }),
    {
      name: 'str-scout-store',
      partialize: (state) => ({
        // Only persist UI preferences, not transient state
        compareIds: state.compareIds,
      }),
    },
  ),
);
