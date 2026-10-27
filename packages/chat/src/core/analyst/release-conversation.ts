import type { UserProfile } from '@nexo/contracts';
import { formatClockTime } from '../clock/format-clock-time.js';
import type { Conversation } from '../conversation/conversation.js';
import {
  type AnalystActionDeps,
  announce,
  assertAssignedTo,
  requireConversation,
} from './analyst-action-support.js';

export type AnalystConversationInput = {
  analyst: UserProfile;
  conversationId: string;
};

export class ReleaseConversation {
  constructor(private readonly deps: AnalystActionDeps) {}

  async execute(input: AnalystConversationInput): Promise<Conversation> {
    const conversation = await requireConversation(this.deps.conversations, input.conversationId);
    assertAssignedTo(conversation, input.analyst.id);
    const released = conversation.release();
    await this.deps.conversations.save(released);
    const time = formatClockTime(this.deps.clock.now().toISOString());
    await announce(this.deps, {
      conversation: released,
      kind: 'released',
      label: `${input.analyst.name} devolveu a conversa ao agent · ${time}`,
      actorName: input.analyst.name,
    });
    return released;
  }
}
