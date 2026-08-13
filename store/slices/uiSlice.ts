import { StateCreator } from "zustand";
import { ThemeMode } from "../../constants/theme";

export interface UISlice {
  isLoading: boolean;
  error: string | null;
  isAccountModalOpen: boolean;
  themeMode: ThemeMode;
  setError: (msg: string | null) => void;
  openAccountModal: () => void;
  closeAccountModal: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

export const createUISlice: StateCreator<UISlice> = (set) => ({
  isLoading: false,
  error: null,
  isAccountModalOpen: false,
  themeMode: "light",
  setError: (msg) => set({ error: msg }),
  openAccountModal: () => set({ isAccountModalOpen: true }),
  closeAccountModal: () => set({ isAccountModalOpen: false }),
  setThemeMode: (mode) => set({ themeMode: mode }),
});
