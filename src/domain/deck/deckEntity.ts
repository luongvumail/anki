export interface DeckEntity {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  cardCount: number;
  newCount: number;
  dueCount: number;
  createdAt: string;
  updatedAt: string;
}
