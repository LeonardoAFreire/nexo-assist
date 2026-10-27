import { Injectable } from '@nestjs/common';
import { CHAT_CONVERSATION_HANDED_OFF, type ChatConversationHandedOff } from '@nexo/contracts';
import { OnEvent } from '@nexo/shared/events';
import { PinoLogger } from '@nexo/shared/logger';
import { TicketsService } from '../core/tickets-service.js';

@Injectable()
export class HandoffListener {
  constructor(
    private readonly tickets: TicketsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext('tickets');
  }

  @OnEvent(CHAT_CONVERSATION_HANDED_OFF)
  async onConversationHandedOff(event: ChatConversationHandedOff): Promise<void> {
    try {
      await this.tickets.recordHandoff(event.payload);
    } catch (error: unknown) {
      this.logger.error(
        { err: error, conversationId: event.payload.conversationId },
        'Falha ao registrar a transferência no histórico dos chamados',
      );
    }
  }
}
