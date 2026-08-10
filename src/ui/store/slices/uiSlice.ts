import { UISliceState } from "../types.js";

export const createUISlice = (
  set: (fn: (state: UISliceState) => Partial<UISliceState>) => void,
): UISliceState => ({
  isAIModalOpen: false,

  openAIModal: () => set(() => ({ isAIModalOpen: true })),
  closeAIModal: () => set(() => ({ isAIModalOpen: false })),
});
