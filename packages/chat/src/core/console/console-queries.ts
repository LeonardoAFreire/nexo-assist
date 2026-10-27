import type {
  ConsoleConversationDetail,
  ConsoleCounters,
  ConsoleConversationItem,
  ConsoleFilter,
  ConsoleList,
} from '@nexo/contracts';
import type { ConversationRepository } from '../conversation/conversation-repository.js';
import { ChatRuleError } from '../errors/chat-rule.error.js';
import type { MessageRepository } from '../messages/message-repository.js';
import { CONSOLE_TIMELINE_LIMIT, type TimelineBuilder } from '../timeline/timeline-builder.js';
import type { ConversationViewBuilder } from '../view/conversation-view-builder.js';
import type { ConsoleDirectory } from './console-directory.js';
import { countEntries, matchesFilter, matchesQuery, sortEntries } from './console-selection.js';

const CONVERSATION_NOT_FOUND_MESSAGE = 'Conversa não encontrada.';

export type ListConsoleInput = {
  viewerId: string;
  filter: ConsoleFilter;
  q?: string | undefined;
};

export type ConsoleItemUpdate = {
  item: ConsoleConversationItem;
  counters: ConsoleCounters;
};

export type ConsoleQueriesDeps = {
  directory: ConsoleDirectory;
  conversations: ConversationRepository;
  messages: MessageRepository;
  views: ConversationViewBuilder;
  timeline: TimelineBuilder;
};

export class ConsoleQueries {
  constructor(private readonly deps: ConsoleQueriesDeps) {}

  async list(input: ListConsoleInput): Promise<ConsoleList> {
    const entries = await this.deps.directory.loadEntries(input.viewerId);
    const searched = entries.filter((entry) => matchesQuery(entry, input.q));
    const selected = searched.filter((entry) => matchesFilter(entry, input.filter, input.viewerId));
    return {
      items: sortEntries(selected).map((entry) => entry.item),
      counters: countEntries(searched, input.viewerId),
    };
  }

  async itemUpdate(input: {
    viewerId: string;
    conversationId: string;
  }): Promise<ConsoleItemUpdate> {
    const entries = await this.deps.directory.loadEntries(input.viewerId);
    const entry = entries.find((candidate) => candidate.item.id === input.conversationId);
    if (entry === undefined) {
      throw new ChatRuleError('not_found', CONVERSATION_NOT_FOUND_MESSAGE);
    }
    return { item: entry.item, counters: countEntries(entries, input.viewerId) };
  }

  async detail(conversationId: string): Promise<ConsoleConversationDetail> {
    const conversation = await this.deps.conversations.findById(conversationId);
    if (conversation === null) {
      throw new ChatRuleError('not_found', CONVERSATION_NOT_FOUND_MESSAGE);
    }
    const messages = await this.deps.messages.listRecent({
      conversationId,
      limit: CONSOLE_TIMELINE_LIMIT,
    });
    return {
      conversation: await this.deps.views.build(conversation),
      timeline: await this.deps.timeline.refreshPendingActions(messages),
    };
  }
}
