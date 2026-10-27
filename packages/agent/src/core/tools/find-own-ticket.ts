import { type TicketDetail, TicketNotFoundError, type TicketsApi } from '@nexo/contracts';

export type OwnTicketLookup = Pick<TicketsApi, 'findOwn'>;

export async function findOwnTicket(
  tickets: OwnTicketLookup,
  owner: { requesterId: string; number: string },
): Promise<TicketDetail | null> {
  try {
    return await tickets.findOwn(owner);
  } catch (error: unknown) {
    if (error instanceof TicketNotFoundError) {
      return null;
    }
    throw error;
  }
}
