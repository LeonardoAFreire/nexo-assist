import { randomUUID } from 'node:crypto';
import type { AgentTurnEvent, AgentTurnInput } from '@nexo/contracts';
import type { TokenPricing } from './agent-settings.js';
import type { Clock } from './clock.js';
import { SearchedArticles } from './searched-articles.js';
import { StepRecorder } from './step-recorder.js';
import type { TurnContext } from './turn-context.js';
import { TurnMetrics } from './turn-metrics.js';
import { TurnObserver } from './turn-observer.js';

const PARAGRAPH_BREAK = '\n\n';

export type TurnSessionDeps = {
  clock: Clock;
  pricing: TokenPricing;
  forward: (event: AgentTurnEvent) => void;
};

export class TurnSession {
  readonly runId = randomUUID();
  readonly recorder = new StepRecorder();
  readonly observer = new TurnObserver();
  readonly metrics: TurnMetrics;
  readonly context: TurnContext;
  readonly startedAt: Date;
  private criticalReport = false;

  constructor(
    input: AgentTurnInput,
    private readonly deps: TurnSessionDeps,
  ) {
    this.metrics = new TurnMetrics(deps.pricing);
    this.startedAt = deps.clock.now();
    this.context = {
      conversationId: input.conversationId,
      requesterId: input.requester.id,
      clock: deps.clock,
      articles: new SearchedArticles(),
      emit: (event) => this.emit(event),
      questionAsked: () => this.observer.quickOptionsShown,
      questionsAllowed: () => !this.criticalReport,
    };
  }

  markCriticalReport(isCritical: boolean): void {
    this.criticalReport = isCritical;
  }

  elapsedMs(): number {
    return this.deps.clock.now().getTime() - this.startedAt.getTime();
  }

  emit(event: AgentTurnEvent): void {
    this.observer.watch(event, this.elapsedMs());
    this.deps.forward(event);
  }

  say(text: string): void {
    const separator = this.observer.text === '' ? '' : PARAGRAPH_BREAK;
    this.emit({ type: 'text-delta', delta: `${separator}${text}` });
  }
}
