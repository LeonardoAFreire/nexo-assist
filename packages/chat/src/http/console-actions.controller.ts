import { Body, Controller, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import {
  type AnalystMessageRequest,
  analystMessageRequestSchema,
  type ChatMessage,
  type ConsoleConversationParams,
  consoleConversationParamsSchema,
  type Conversation,
  type UserProfile,
} from '@nexo/contracts';
import { CurrentSession, OriginGuard, Roles, SessionGuard } from '@nexo/shared/auth';
import { ZodValidationPipe } from '@nexo/shared/http';
import { AnalystAttendance } from '../core/analyst/analyst-attendance.js';
import { AnalystProfilePipe } from './analyst-profile.pipe.js';
import { withChatErrors } from './chat-error.mapper.js';

const paramsPipe = new ZodValidationPipe(consoleConversationParamsSchema);

@Controller('console/conversations/:id')
@UseGuards(SessionGuard, OriginGuard)
@Roles('analyst')
export class ConsoleActionsController {
  constructor(private readonly attendance: AnalystAttendance) {}

  @Post('claim')
  @HttpCode(HttpStatus.OK)
  claim(
    @Param(paramsPipe) params: ConsoleConversationParams,
    @CurrentSession(AnalystProfilePipe) analyst: UserProfile,
  ): Promise<Conversation> {
    const input = { analyst, conversationId: params.id };
    return withChatErrors(() => this.attendance.claim(input));
  }

  @Post('release')
  @HttpCode(HttpStatus.OK)
  release(
    @Param(paramsPipe) params: ConsoleConversationParams,
    @CurrentSession(AnalystProfilePipe) analyst: UserProfile,
  ): Promise<Conversation> {
    const input = { analyst, conversationId: params.id };
    return withChatErrors(() => this.attendance.release(input));
  }

  @Post('close')
  @HttpCode(HttpStatus.OK)
  close(
    @Param(paramsPipe) params: ConsoleConversationParams,
    @CurrentSession(AnalystProfilePipe) analyst: UserProfile,
  ): Promise<Conversation> {
    const input = { analyst, conversationId: params.id };
    return withChatErrors(() => this.attendance.close(input));
  }

  @Post('messages')
  @HttpCode(HttpStatus.CREATED)
  send(
    @Param(paramsPipe) params: ConsoleConversationParams,
    @Body(new ZodValidationPipe(analystMessageRequestSchema)) body: AnalystMessageRequest,
    @CurrentSession(AnalystProfilePipe) analyst: UserProfile,
  ): Promise<ChatMessage> {
    const input = { analyst, conversationId: params.id, text: body.text };
    return withChatErrors(() => this.attendance.sendMessage(input));
  }
}
