import type { AgentTurnEvent } from '@nexo/contracts';
import type { Clock } from './clock.js';
import type { SearchedArticles } from './searched-articles.js';

export type TurnContext = {
  readonly conversationId: string;
  readonly requesterId: string;
  readonly clock: Clock;
  readonly articles: SearchedArticles;
  emit(event: AgentTurnEvent): void;
};
