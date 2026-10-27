import { TicketNotFoundError, TicketsUnavailableError } from '@nexo/contracts';
import { describe, expect, it } from 'vitest';
import { makeTicket } from '../../persistence/scripted/make-ticket.js';
import { findOwnTicket } from './find-own-ticket.js';

const owner = { requesterId: '11111111-1111-4111-8111-111111111111', number: 'INC-20311' };

describe('findOwnTicket', () => {
  it('devolve o chamado encontrado', async () => {
    const ticket = makeTicket();
    expect(await findOwnTicket({ findOwn: async () => ticket }, owner)).toBe(ticket);
  });

  it('trata TicketNotFoundError como chamado ausente', async () => {
    const tickets = {
      findOwn: async () => {
        throw new TicketNotFoundError();
      },
    };
    expect(await findOwnTicket(tickets, owner)).toBeNull();
  });

  it('repassa a indisponibilidade do sistema de chamados', async () => {
    const tickets = {
      findOwn: async () => {
        throw new TicketsUnavailableError();
      },
    };
    await expect(findOwnTicket(tickets, owner)).rejects.toBeInstanceOf(TicketsUnavailableError);
  });
});
