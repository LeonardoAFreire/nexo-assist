import type { MessageEvent } from '@nestjs/common';
import { Body, Controller, Get, HttpCode, HttpStatus, Post, Sse, UseGuards } from '@nestjs/common';
import {
  type Conversation,
  type RequestHandoffRequest,
  requestHandoffRequestSchema,
} from '@nexo/contracts';
import {
  CurrentSession,
  OriginGuard,
  Roles,
  type SessionClaims,
  SessionGuard,
} from '@nexo/shared/auth';
import { ZodValidationPipe } from '@nexo/shared/http';
import { map, type Observable } from 'rxjs';
import { ConversationEventsHub } from '../core/events/conversation-events-hub.js';
import { EmployeeHandoff } from '../core/handoff/employee-handoff.js';
import { withChatErrors } from './chat-error.mapper.js';
import { toMessageEvent, withHeartbeat } from './sse-events.js';
import { UserThrottlerGuard } from './user-throttler.guard.js';

@Controller('conversations/current')
@UseGuards(SessionGuard, OriginGuard)
@Roles('employee')
export class ConversationStreamController {
  constructor(
    private readonly handoff: EmployeeHandoff,
    private readonly hub: ConversationEventsHub,
  ) {}

  @Post('handoff')
  @HttpCode(HttpStatus.OK)
  @UseGuards(UserThrottlerGuard)
  requestHandoff(
    @Body(new ZodValidationPipe(requestHandoffRequestSchema)) _request: RequestHandoffRequest,
    @CurrentSession() claims: SessionClaims,
  ): Promise<Conversation> {
    return withChatErrors(() => this.handoff.execute({ employeeId: claims.userId }));
  }

  @Get('events')
  @Sse()
  events(@CurrentSession() claims: SessionClaims): Observable<MessageEvent> {
    const own = this.hub.forEmployee(claims.userId).pipe(map(toMessageEvent));
    return withHeartbeat(own);
  }
}
