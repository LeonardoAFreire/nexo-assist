import type { TicketCategory } from '@nexo/contracts';

export type Article = {
  id: string;
  title: string;
  body: string;
  conditions: string | null;
  category: TicketCategory;
};
