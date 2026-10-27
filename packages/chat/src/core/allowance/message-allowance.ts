import type { MessageUsage } from '@nexo/contracts';
import { ChatRuleError } from '../errors/chat-rule.error.js';
import type { SessionUsageRepository } from './session-usage-repository.js';

export const SESSION_MESSAGE_LIMIT = 30;

const LIMIT_REACHED_MESSAGE =
  'Você chegou ao limite de 30 mensagens desta sessão. Fale com um analista para continuar.';

export type SessionUsageOwner = {
  sessionId: string;
  userId: string;
};

export type MessageAllowanceResult = MessageUsage & { remaining: number };

export class MessageAllowance {
  constructor(private readonly usage: SessionUsageRepository) {}

  async consume(owner: SessionUsageOwner): Promise<MessageAllowanceResult> {
    const messagesUsed = await this.usage.incrementBelowLimit({
      ...owner,
      limit: SESSION_MESSAGE_LIMIT,
    });
    if (messagesUsed === null) {
      throw new ChatRuleError('message_limit_reached', LIMIT_REACHED_MESSAGE);
    }
    return toResult(messagesUsed);
  }

  async current(sessionId: string): Promise<MessageAllowanceResult> {
    return toResult(await this.usage.countFor(sessionId));
  }
}

function toResult(messagesUsed: number): MessageAllowanceResult {
  return {
    messagesUsed,
    messagesLimit: SESSION_MESSAGE_LIMIT,
    remaining: SESSION_MESSAGE_LIMIT - messagesUsed,
  };
}
