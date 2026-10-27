import { Conversation } from '../conversation/conversation.js';
import { InMemoryMessageRepository } from '../messages/in-memory-message-repository.js';
import { InMemoryPendingActionRepository } from '../pending-actions/in-memory-pending-action-repository.js';
import { PendingActions } from '../pending-actions/pending-actions.js';
import { CONVERSATION_ID, EMPLOYEE_ID, FixedClock, NOW_ISO } from './factories.js';
import { FakeTicketsApi } from './fake-tickets-api.js';

export type PendingActionFixture = {
  conversation: Conversation;
  actions: InMemoryPendingActionRepository;
  messages: InMemoryMessageRepository;
  tickets: FakeTicketsApi;
  clock: FixedClock;
  pendingActions: PendingActions;
};

export function makeFixture(): PendingActionFixture {
  const actions = new InMemoryPendingActionRepository();
  const tickets = new FakeTicketsApi();
  const clock = new FixedClock();
  return {
    conversation: Conversation.open({ id: CONVERSATION_ID, employeeId: EMPLOYEE_ID, now: NOW_ISO }),
    actions,
    messages: new InMemoryMessageRepository(),
    tickets,
    clock,
    pendingActions: new PendingActions(actions, tickets, clock),
  };
}
