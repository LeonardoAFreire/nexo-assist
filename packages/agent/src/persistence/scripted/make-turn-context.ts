import type { AgentTurnEvent } from '@nexo/contracts';
import { SearchedArticles } from '../../core/searched-articles.js';
import type { TurnContext } from '../../core/turn-context.js';
import { FakeClock } from './fake-clock.js';

const DEFAULT_CONVERSATION_ID = '4f0a1c9e-3d6b-4a52-9b8e-7c1d2e3f4a5b';
const DEFAULT_REQUESTER_ID = '0b9a8c7d-6e5f-4a3b-8c2d-1e0f9a8b7c6d';

export type TurnContextOverrides = Partial<Pick<TurnContext, 'requesterId' | 'clock'>>;

export type CollectedTurnContext = {
  context: TurnContext;
  events: AgentTurnEvent[];
  clock: FakeClock;
};

export function makeTurnContext(overrides: TurnContextOverrides = {}): CollectedTurnContext {
  const events: AgentTurnEvent[] = [];
  const clock = new FakeClock();
  const context: TurnContext = {
    conversationId: DEFAULT_CONVERSATION_ID,
    requesterId: DEFAULT_REQUESTER_ID,
    clock,
    articles: new SearchedArticles(),
    emit: (event) => {
      events.push(event);
    },
    questionAsked: () =>
      events.some((event) => event.type === 'part' && event.part.type === 'quick_options'),
    ...overrides,
  };
  return { context, events, clock };
}
