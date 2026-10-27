import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  type ConsoleConversationDetail,
  type ConsoleConversationParams,
  type ConsoleEmployeeTickets,
  type ConsoleList,
  type ConsoleListQuery,
  consoleConversationParamsSchema,
  consoleListQuerySchema,
  type UserProfile,
} from '@nexo/contracts';
import {
  CurrentSession,
  OriginGuard,
  Roles,
  type SessionClaims,
  SessionGuard,
} from '@nexo/shared/auth';
import { ZodValidationPipe } from '@nexo/shared/http';
import { AnalystTicketAccess } from '../core/console/analyst-ticket-access.js';
import { ConsoleQueries } from '../core/console/console-queries.js';
import { MarkConversationRead } from '../core/console/mark-conversation-read.js';
import { AnalystProfilePipe } from './analyst-profile.pipe.js';
import { withChatErrors } from './chat-error.mapper.js';

const paramsPipe = new ZodValidationPipe(consoleConversationParamsSchema);

@Controller('console/conversations')
@UseGuards(SessionGuard, OriginGuard)
@Roles('analyst')
export class ConsoleController {
  constructor(
    private readonly queries: ConsoleQueries,
    private readonly tickets: AnalystTicketAccess,
    private readonly markRead: MarkConversationRead,
  ) {}

  @Get()
  list(
    @Query(new ZodValidationPipe(consoleListQuerySchema)) query: ConsoleListQuery,
    @CurrentSession() claims: SessionClaims,
  ): Promise<ConsoleList> {
    return this.queries.list({ viewerId: claims.userId, filter: query.filter, q: query.q });
  }

  @Get(':id')
  detail(@Param(paramsPipe) params: ConsoleConversationParams): Promise<ConsoleConversationDetail> {
    return withChatErrors(() => this.queries.detail(params.id));
  }

  @Get(':id/tickets')
  employeeTickets(
    @Param(paramsPipe) params: ConsoleConversationParams,
    @CurrentSession(AnalystProfilePipe) analyst: UserProfile,
  ): Promise<ConsoleEmployeeTickets> {
    const input = { analyst, conversationId: params.id };
    return withChatErrors(() => this.tickets.listFor(input));
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  read(@Param(paramsPipe) params: ConsoleConversationParams): Promise<void> {
    return withChatErrors(() => this.markRead.execute(params.id));
  }
}
