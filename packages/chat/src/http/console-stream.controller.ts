import type { MessageEvent } from '@nestjs/common';
import { Controller, Get, Query, Sse, UseGuards } from '@nestjs/common';
import { type ConsoleEventsQuery, consoleEventsQuerySchema } from '@nexo/contracts';
import {
  CurrentSession,
  OriginGuard,
  Roles,
  type SessionClaims,
  SessionGuard,
} from '@nexo/shared/auth';
import { ZodValidationPipe } from '@nexo/shared/http';
import { map, type Observable } from 'rxjs';
import { ConsoleEventStream } from '../core/console/console-event-stream.js';
import { toMessageEvent, withHeartbeat } from './sse-events.js';

@Controller('console')
@UseGuards(SessionGuard, OriginGuard)
@Roles('analyst')
export class ConsoleStreamController {
  constructor(private readonly stream: ConsoleEventStream) {}

  @Get('events')
  @Sse()
  events(
    @Query(new ZodValidationPipe(consoleEventsQuerySchema)) query: ConsoleEventsQuery,
    @CurrentSession() claims: SessionClaims,
  ): Observable<MessageEvent> {
    const viewerId = claims.userId;
    const updates = this.stream.open({ viewerId, conversationId: query.conversationId });
    return withHeartbeat(updates.pipe(map(toMessageEvent)));
  }
}
