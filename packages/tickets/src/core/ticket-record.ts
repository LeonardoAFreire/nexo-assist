import type { TicketDetail } from '@nexo/contracts';

export type TicketRecord = TicketDetail & {
  requesterId: string;
};
