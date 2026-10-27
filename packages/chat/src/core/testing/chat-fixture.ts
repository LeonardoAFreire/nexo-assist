import type { AnalystActionDeps } from '../analyst/analyst-action-support.js';
import { InMemoryConversationRepository } from '../conversation/in-memory-conversation-repository.js';
import { ConversationEventsHub } from '../events/conversation-events-hub.js';
import { HandOffConversation } from '../handoff/hand-off-conversation.js';
import { HandoffPolicy } from '../handoff/handoff-policy.js';
import { InMemoryMessageRepository } from '../messages/in-memory-message-repository.js';
import { ConversationNotifier } from '../notifier/conversation-notifier.js';
import { InMemoryPendingActionRepository } from '../pending-actions/in-memory-pending-action-repository.js';
import { ConversationViewBuilder } from '../view/conversation-view-builder.js';
import { NOW_ISO } from './factories.js';
import { FakeIdentityApi } from './fake-identity-api.js';
import { FakeTicketsApi } from './fake-tickets-api.js';
import { MutableClock } from './mutable-clock.js';
import { RecordingEventPublisher } from './recording-event-publisher.js';

function makeBase() {
  const actions = new InMemoryPendingActionRepository();
  const identity = new FakeIdentityApi();
  const hub = new ConversationEventsHub();
  return {
    conversations: new InMemoryConversationRepository(),
    messages: new InMemoryMessageRepository(),
    actions,
    clock: new MutableClock(NOW_ISO),
    tickets: new FakeTicketsApi(),
    identity,
    events: new RecordingEventPublisher(),
    hub,
    views: new ConversationViewBuilder(identity, actions),
  };
}

export function makeChatFixture() {
  const base = makeBase();
  const { conversations, messages, clock } = base;
  const notifier = new ConversationNotifier(base.hub, base.views);
  const policy = new HandoffPolicy(base.tickets);
  const handOff = new HandOffConversation({
    conversations,
    messages,
    policy,
    events: base.events,
    notifier,
    clock,
  });
  const analystDeps: AnalystActionDeps = { conversations, messages, notifier, clock };
  return { ...base, analystDeps, notifier, handOff };
}

export type ChatFixture = ReturnType<typeof makeChatFixture>;
