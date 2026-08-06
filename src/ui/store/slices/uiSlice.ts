import { StateCreator } from 'zustand';

export interface UISlice {
  isAccountModalOpen: boolean;
  openAccountModal: () => void;
  closeAccountModal: () => void;
}

export const createUISlice: StateCreator<UISlice, [], [], UISlice> = (set) => ({
  isAccountModalOpen: false,

  openAccountModal: () => set({ isAccountModalOpen: true }),
  closeAccountModal: () => set({ isAccountModalOpen: false }),
});
