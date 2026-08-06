import { create } from "zustand";
import { createCardSlice } from "./slices/cardSlice";
import { createDeckSlice } from "./slices/deckSlice";
import { createProgressSlice } from "./slices/progressSlice";
import { createUISlice } from "./slices/uiSlice";
import { AppStoreState } from "./types";

export type { AppStoreState };

export const useAppStore = create<AppStoreState>()((...a) => ({
  ...createDeckSlice(...a),
  ...createCardSlice(...a),
  ...createProgressSlice(...a),
  ...createUISlice(...a),
}));
