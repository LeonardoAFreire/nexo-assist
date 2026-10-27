import type { UserProfile } from '@nexo/contracts';
import { formatClockTime } from '../clock/format-clock-time.js';
import type { Conversation } from '../conversation/conversation.js';
import { ChatRuleError } from '../errors/chat-rule.error.js';
import { loadProfiles, type ProfileLookup } from '../view/load-profiles.js';
import { type AnalystActionDeps, announce, requireConversation } from './analyst-action-support.js';

const UNKNOWN_ANALYST_NAME = 'outro analista';
const STATE_CHANGED_MESSAGE = 'A conversa mudou de estado.';

export type ClaimConversationInput = {
  analyst: UserProfile;
  conversationId: string;
};

export class ClaimConversation {
  constructor(
    private readonly deps: AnalystActionDeps,
    private readonly identity: ProfileLookup,
  ) {}

  async execute(input: ClaimConversationInput): Promise<Conversation> {
    const conversation = await requireConversation(this.deps.conversations, input.conversationId);
    if (conversation.state === 'with_analyst') {
      throw await this.alreadyClaimed(conversation);
    }
    const claimed = conversation.claim(input.analyst.id);
    const saved = await this.deps.conversations.saveWhenState({
      conversation: claimed,
      expectedState: 'waiting_analyst',
    });
    if (!saved) {
      throw await this.alreadyClaimed(conversation);
    }
    const time = formatClockTime(this.deps.clock.now().toISOString());
    const label = `${input.analyst.name} assumiu · agent pausado · ${time}`;
    await announce(this.deps, {
      conversation: claimed,
      kind: 'claimed',
      label,
      actorName: input.analyst.name,
    });
    return claimed;
  }

  private async alreadyClaimed(stale: Conversation): Promise<ChatRuleError> {
    const current = await this.deps.conversations.findById(stale.id);
    const ownerId = current?.props.assignedAnalystId ?? null;
    if (current?.state !== 'with_analyst') {
      return new ChatRuleError('invalid_conversation_state', STATE_CHANGED_MESSAGE);
    }
    const profiles = await loadProfiles(this.identity, [ownerId]);
    const name = profiles.get(ownerId ?? '')?.name ?? UNKNOWN_ANALYST_NAME;
    return new ChatRuleError(
      'conversation_already_claimed',
      `Esta conversa já está sendo atendida por ${name}.`,
    );
  }
}
