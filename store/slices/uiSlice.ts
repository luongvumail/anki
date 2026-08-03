import { StateCreator } from "zustand";

export interface UISlice {
  isLoading: boolean;
  error: string | null;
  isAccountModalOpen: boolean;
  setError: (msg: string | null) => void;
  openAccountModal: () => void;
  closeAccountModal: () => void;
}

export const createUISlice: StateCreator<UISlice> = (set) => ({
  isLoading: false,
  error: null,
  isAccountModalOpen: false,
  setError: (msg) => set({ error: msg }),
  openAccountModal: () => set({ isAccountModalOpen: true }),
  closeAccountModal: () => set({ isAccountModalOpen: false }),
});
