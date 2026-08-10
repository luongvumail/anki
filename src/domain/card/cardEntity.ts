import { FSRSCardState } from "../fsrs/fsrsTypes.js";

export interface CardEntity {
  id: string;
  deckId: string;
  kanji: string;
  pinyin: string;
  meaning: string;
  radicalAnalysis?: string;
  exampleSentence?: string;
  hskLevel?: number;
  fsrsState: FSRSCardState;
  createdAt: string;
  updatedAt: string;
}
