import { Controller, Get, Inject, Param, Query, UseGuards } from '@nestjs/common';
import {
  type ListTicketsQuery,
  listTicketsQuerySchema,
  TICKETS_API,
  type TicketDetail,
  type TicketParams,
  ticketParamsSchema,
  type TicketsApi,
  type TicketSummary,
} from '@nexo/contracts';
import { CurrentSession, Roles, type SessionClaims, SessionGuard } from '@nexo/shared/auth';
import { ZodValidationPipe } from '@nexo/shared/http';
import { mapTicketErrors, ticketNotFound } from './tickets-http-errors.js';

@Controller('tickets')
@UseGuards(SessionGuard)
@Roles('employee')
export class TicketsController {
  constructor(@Inject(TICKETS_API) private readonly tickets: TicketsApi) {}

  @Get()
  list(
    @Query(new ZodValidationPipe(listTicketsQuerySchema)) query: ListTicketsQuery,
    @CurrentSession() session: SessionClaims,
  ): Promise<TicketSummary[]> {
    return mapTicketErrors(() =>
      this.tickets.listOwn({ requesterId: session.userId, scope: query.scope }),
    );
  }

  @Get(':number')
  async find(
    @Param(new ZodValidationPipe(ticketParamsSchema)) params: TicketParams,
    @CurrentSession() session: SessionClaims,
  ): Promise<TicketDetail> {
    const ticket = await mapTicketErrors(() =>
      this.tickets.findOwn({ requesterId: session.userId, number: params.number }),
    );
    if (ticket === null) {
      throw ticketNotFound();
    }
    return ticket;
  }
}
