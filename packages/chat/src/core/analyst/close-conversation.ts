import { formatClockTime } from '../clock/format-clock-time.js';
import type { Conversation } from '../conversation/conversation.js';
import {
  type AnalystActionDeps,
  announce,
  assertAssignedTo,
  requireConversation,
} from './analyst-action-support.js';
import type { AnalystConversationInput } from './release-conversation.js';

export class CloseConversation {
  constructor(private readonly deps: AnalystActionDeps) {}

  async execute(input: AnalystConversationInput): Promise<Conversation> {
    const conversation = await requireConversation(this.deps.conversations, input.conversationId);
    assertAssignedTo(conversation, input.analyst.id);
    const closedAt = this.deps.clock.now().toISOString();
    const closed = conversation.closeByAnalyst(closedAt);
    await this.deps.conversations.save(closed);
    await announce(this.deps, {
      conversation: closed,
      kind: 'closed',
      label: `${input.analyst.name} encerrou o atendimento · ${formatClockTime(closedAt)}`,
      actorName: input.analyst.name,
    });
    return closed;
  }
}
