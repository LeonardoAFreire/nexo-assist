import { Body, Controller, Get, HttpCode, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import {
  type EmployeeConversationView,
  type SendMessageRequest,
  sendMessageRequestSchema,
} from '@nexo/contracts';
import {
  CurrentSession,
  OriginGuard,
  Roles,
  type SessionClaims,
  SessionGuard,
} from '@nexo/shared/auth';
import { type SseTarget, ZodValidationPipe } from '@nexo/shared/http';
import { RetryEmployeeTurn } from '../core/send/retry-employee-turn.js';
import type { EmployeeSession } from '../core/send/turn-context.js';
import { SendEmployeeMessage } from '../core/send/send-employee-message.js';
import { GetEmployeeConversation } from '../core/timeline/get-employee-conversation.js';
import { EmployeeSessionPipe } from './employee-session.pipe.js';
import { streamTurn } from './stream-turn.js';
import { UserThrottlerGuard } from './user-throttler.guard.js';

@Controller('conversations/current')
@UseGuards(SessionGuard, OriginGuard)
@Roles('employee')
export class EmployeeConversationController {
  constructor(
    private readonly conversation: GetEmployeeConversation,
    private readonly sendMessage: SendEmployeeMessage,
    private readonly retryTurn: RetryEmployeeTurn,
  ) {}

  @Get()
  current(@CurrentSession() claims: SessionClaims): Promise<EmployeeConversationView> {
    return this.conversation.execute({ employeeId: claims.userId, sessionId: claims.sessionId });
  }

  @Post('messages')
  @HttpCode(HttpStatus.OK)
  @UseGuards(UserThrottlerGuard)
  async send(
    @Body(new ZodValidationPipe(sendMessageRequestSchema)) body: SendMessageRequest,
    @CurrentSession(EmployeeSessionPipe) session: EmployeeSession,
    @Res() response: SseTarget,
  ): Promise<void> {
    await streamTurn(response, (signal) => this.sendMessage.execute({ ...body, session, signal }));
  }

  @Post('turns/retry')
  @HttpCode(HttpStatus.OK)
  @UseGuards(UserThrottlerGuard)
  async retry(
    @CurrentSession(EmployeeSessionPipe) session: EmployeeSession,
    @Res() response: SseTarget,
  ): Promise<void> {
    await streamTurn(response, (signal) => this.retryTurn.execute({ session, signal }));
  }
}
