import type {
  ConsoleEmployeeTickets,
  TicketsApi,
  TicketSummary,
  UserProfile,
} from '@nexo/contracts';
import { withResilience } from '@nexo/shared/resilience';
import type { Conversation } from '../conversation/conversation.js';
import type { ConversationRepository } from '../conversation/conversation-repository.js';
import { ChatRuleError } from '../errors/chat-rule.error.js';
import { collectTicketNumbers } from '../handoff/collect-ticket-numbers.js';
import type { MessageRepository } from '../messages/message-repository.js';
import { TICKETS_RESILIENCE_POLICY } from '../pending-actions/tickets-resilience.js';
import { asConfirmationError } from '../send/turn-failure.js';
import { EMPLOYEE_TIMELINE_LIMIT } from '../timeline/timeline-builder.js';

const NOT_FOUND_MESSAGE = 'Conversa não encontrada.';
const FORBIDDEN_MESSAGE = 'Apenas analistas acessam os chamados de um funcionário.';

export type TicketsReader = Pick<TicketsApi, 'listOwn'>;

export type AnalystTicketAccessInput = {
  analyst: UserProfile;
  conversationId: string;
};

export class AnalystTicketAccess {
  constructor(
    private readonly conversations: ConversationRepository,
    private readonly messages: MessageRepository,
    private readonly tickets: TicketsReader,
  ) {}

  async listFor(input: AnalystTicketAccessInput): Promise<ConsoleEmployeeTickets> {
    if (input.analyst.role !== 'analyst') {
      throw new ChatRuleError('forbidden', FORBIDDEN_MESSAGE);
    }
    const conversation = await this.requireAccessible(input);
    const tickets = await this.listOf(conversation.employeeId);
    const messages = await this.messages.listRecent({
      conversationId: conversation.id,
      limit: EMPLOYEE_TIMELINE_LIMIT,
    });
    const cited = new Set([
      ...(conversation.props.handoff?.ticketNumbers ?? []),
      ...collectTicketNumbers(messages),
    ]);
    const others = tickets.filter((ticket) => !cited.has(ticket.number));
    return {
      fromConversation: tickets.filter((ticket) => cited.has(ticket.number)),
      others: {
        open: others.filter((ticket) => ticket.status !== 'resolved'),
        closed: others.filter((ticket) => ticket.status === 'resolved'),
      },
    };
  }

  private async listOf(requesterId: string): Promise<TicketSummary[]> {
    try {
      const read = () => this.tickets.listOwn({ requesterId, scope: 'all' });
      return await withResilience(read, TICKETS_RESILIENCE_POLICY);
    } catch (error: unknown) {
      throw asConfirmationError(error);
    }
  }

  private async requireAccessible(input: AnalystTicketAccessInput): Promise<Conversation> {
    const conversation = await this.conversations.findById(input.conversationId);
    if (conversation === null || !canAccess(conversation, input.analyst.id)) {
      throw new ChatRuleError('not_found', NOT_FOUND_MESSAGE);
    }
    return conversation;
  }
}

function canAccess(conversation: Conversation, analystId: string): boolean {
  if (conversation.state === 'waiting_analyst') {
    return true;
  }
  return (
    conversation.state === 'with_analyst' && conversation.props.assignedAnalystId === analystId
  );
}
