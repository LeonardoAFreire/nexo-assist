import type { UserProfile } from '@nexo/contracts';
import type { Clock } from '../clock/clock.js';
import type { Conversation } from '../conversation/conversation.js';
import type { ConversationRepository } from '../conversation/conversation-repository.js';
import type { MessageRepository } from '../messages/message-repository.js';
import { EMPLOYEE_TIMELINE_LIMIT } from '../timeline/timeline-builder.js';
import { loadProfiles, type ProfileLookup } from '../view/load-profiles.js';
import { buildConsoleItem } from './console-item-builder.js';
import type { ConsoleEntry } from './console-selection.js';

export type ConsoleDirectoryDeps = {
  conversations: ConversationRepository;
  messages: MessageRepository;
  identity: ProfileLookup;
  clock: Clock;
};

export class ConsoleDirectory {
  constructor(private readonly deps: ConsoleDirectoryDeps) {}

  async loadEntries(viewerId: string): Promise<ConsoleEntry[]> {
    const conversations = await this.deps.conversations.listAll();
    const profiles = await loadProfiles(
      this.deps.identity,
      conversations.flatMap((item) => [item.employeeId, item.props.assignedAnalystId]),
    );
    const now = this.deps.clock.now();
    const entries = await Promise.all(
      conversations.map(async (conversation) => {
        const source = await this.sourceOf(conversation, profiles);
        return source === null
          ? null
          : { source, item: buildConsoleItem(source, { viewerId, now }) };
      }),
    );
    return entries.filter((entry): entry is ConsoleEntry => entry !== null);
  }

  private async sourceOf(
    conversation: Conversation,
    profiles: Map<string, UserProfile>,
  ): Promise<ConsoleEntry['source'] | null> {
    const employee = profiles.get(conversation.employeeId);
    if (employee === undefined) {
      return null;
    }
    const messages = await this.deps.messages.listRecent({
      conversationId: conversation.id,
      limit: EMPLOYEE_TIMELINE_LIMIT,
    });
    const assignedAnalyst = profiles.get(conversation.props.assignedAnalystId ?? '') ?? null;
    return { conversation, employee, assignedAnalyst, messages };
  }
}
