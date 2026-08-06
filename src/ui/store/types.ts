import { CardSlice } from "./slices/cardSlice";
import { DeckSlice } from "./slices/deckSlice";
import { ProgressSlice } from "./slices/progressSlice";
import { UISlice } from "./slices/uiSlice";

export type AppStoreState = DeckSlice & CardSlice & ProgressSlice & UISlice;
