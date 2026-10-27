import { InMemorySessionUsageRepository } from '../allowance/in-memory-session-usage-repository.js';
import { MessageAllowance } from '../allowance/message-allowance.js';
import { ConfirmPendingAction } from '../pending-actions/confirm-pending-action.js';
import { PendingActions } from '../pending-actions/pending-actions.js';
import { TimelineBuilder } from '../timeline/timeline-builder.js';
import type { EmployeeTurnDeps } from '../send/employee-turn-deps.js';
import { type ChatFixture, makeChatFixture } from './chat-fixture.js';
import { ScriptedAgentApi } from './fake-agent-api.js';

const FAST_POLICY = { attempts: 3, timeoutMs: 1000, baseDelayMs: 1, backoffFactor: 1 };

export type TurnFixture = ChatFixture & {
  agent: ScriptedAgentApi;
  turnDeps: EmployeeTurnDeps;
  timeline: TimelineBuilder;
};

export function makeTurnFixture(): TurnFixture {
  const fixture = makeChatFixture();
  const { conversations, messages, actions, clock, tickets } = fixture;
  const agent = new ScriptedAgentApi();
  const turnDeps: EmployeeTurnDeps = {
    conversations,
    messages,
    actions,
    allowance: new MessageAllowance(new InMemorySessionUsageRepository()),
    pendingActions: new PendingActions(actions, tickets, clock),
    confirm: new ConfirmPendingAction({ actions, messages, tickets, clock, policy: FAST_POLICY }),
    agent,
    handOff: fixture.handOff,
    notifier: fixture.notifier,
    views: fixture.views,
    clock,
  };
  return { ...fixture, agent, turnDeps, timeline: new TimelineBuilder(actions) };
}
