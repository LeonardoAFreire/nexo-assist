import type {
  ChatMessage,
  QuickOption,
  QuickReplyInput,
  TicketSelectionInput,
} from '@nexo/contracts';
import type { Conversation } from '../conversation/conversation.js';
import { findOpenOptions } from '../matchers/find-open-options.js';
import { QuickReplyResolver } from '../matchers/quick-reply-resolver.js';
import type { MessageRepository } from '../messages/message-repository.js';
import { answerQuickOptions, selectTicket } from './answer-parts.js';
import { assertTicketOffered, requireOpenOption, requireReplyMessage } from './reply-lookup.js';

export type ResolveTextInput = {
  text: string;
  quickReply: QuickReplyInput | null;
  ticketSelection: TicketSelectionInput | null;
};

export type ResolvedText = {
  text: string;
  agentText: string;
  answered: ChatMessage | null;
};

export class EmployeeTextResolver {
  private readonly quickReplies = new QuickReplyResolver();

  constructor(private readonly messages: Pick<MessageRepository, 'findById' | 'listRecent'>) {}

  async resolve(conversation: Conversation, input: ResolveTextInput): Promise<ResolvedText> {
    if (input.quickReply !== null) {
      return this.fromQuickReply(conversation, input.quickReply);
    }
    if (input.ticketSelection !== null) {
      return this.fromSelection(conversation, input.ticketSelection, input.text);
    }
    return this.fromTypedDigit(conversation, input.text);
  }

  private async fromQuickReply(
    conversation: Conversation,
    quickReply: QuickReplyInput,
  ): Promise<ResolvedText> {
    const message = await requireReplyMessage(this.messages, conversation, quickReply.messageId);
    return this.answered(requireOpenOption(message, quickReply.optionId), message);
  }

  private async fromSelection(
    conversation: Conversation,
    selection: TicketSelectionInput,
    text: string,
  ): Promise<ResolvedText> {
    const message = await requireReplyMessage(this.messages, conversation, selection.messageId);
    assertTicketOffered(message, selection.number);
    const agentText = text.includes(selection.number) ? text : `${text} (${selection.number})`;
    return { text, agentText, answered: selectTicket(message, selection.number) };
  }

  private async fromTypedDigit(conversation: Conversation, text: string): Promise<ResolvedText> {
    const [last] = await this.messages.listRecent({ conversationId: conversation.id, limit: 1 });
    const options = findOpenOptions(last ?? null);
    const resolution = this.quickReplies.resolve({ text, options });
    if (resolution.option === null || last === undefined) {
      return { text, agentText: text, answered: null };
    }
    return this.answered(resolution.option, last);
  }

  private answered(option: QuickOption, message: ChatMessage): ResolvedText {
    return { text: option.label, agentText: option.label, answered: answerQuickOptions(message) };
  }
}
