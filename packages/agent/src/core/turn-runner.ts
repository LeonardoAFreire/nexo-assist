import type { AgentTurnInput, Understanding } from '@nexo/contracts';
import type { AgentRunRepository } from './agent-run-repository.js';
import type { AgentSettings } from './agent-settings.js';
import type { AgentTool } from './agent-tool.js';
import { BUDGET_UNDERSTANDING } from './budget-understanding.js';
import { BudgetGuard } from './budget-guard.js';
import type { Clock } from './clock.js';
import { ContextBuilder } from './context-builder.js';
import { BUDGET_DEGRADATION, type Degradation, toDegradation } from './degradation.js';
import { HANDOFF_TEXT, requestHandoff } from './fixed-replies.js';
import { wasImpactAsked } from './impact-history.js';
import type { LlmClient, LlmMessage } from './llm-client.js';
import { PromptCatalog } from './prompt-catalog.js';
import { ResponseLoop } from './response-loop.js';
import { TurnFinisher } from './turn-finisher.js';
import { TurnPolicy } from './turn-policy.js';
import type { RespondableRoute } from './turn-route.js';
import type { TurnSession } from './turn-session.js';
import { UnderstandingStep } from './understanding-step.js';

export type TurnRunnerDeps = {
  llm: LlmClient;
  runs: AgentRunRepository;
  clock: Clock;
  tools: AgentTool[];
  settings: AgentSettings;
};

export class TurnRunner {
  private readonly budget: BudgetGuard;
  private readonly policy: TurnPolicy;
  private readonly prompts = new PromptCatalog();
  private readonly contexts = new ContextBuilder();
  private readonly understanding: UnderstandingStep;
  private readonly loop: ResponseLoop;
  private readonly finisher: TurnFinisher;

  constructor(private readonly deps: TurnRunnerDeps) {
    this.budget = new BudgetGuard(deps.runs, deps.settings.dailyBudgetUsd);
    this.policy = new TurnPolicy(deps.settings.confidenceThreshold);
    this.understanding = new UnderstandingStep(deps.llm, this.prompts);
    this.loop = new ResponseLoop(deps.llm);
    this.finisher = new TurnFinisher(deps.runs);
  }

  async run(input: AgentTurnInput, turn: TurnSession): Promise<void> {
    const verdict = await this.budget.check(input.conversationId, turn.startedAt);
    if (verdict === 'daily_exhausted') {
      turn.emit({ type: 'failed', code: 'budget_exhausted', retryable: false });
      return;
    }
    if (verdict === 'conversation_exhausted') {
      const input = { understanding: BUDGET_UNDERSTANDING, degradation: BUDGET_DEGRADATION };
      await this.finisher.finish(turn, input);
      return;
    }
    await this.handleTurn(input, turn);
  }

  private async handleTurn(input: AgentTurnInput, turn: TurnSession): Promise<void> {
    const messages = this.contexts.build(input);
    const understanding = await this.understand(messages, turn);
    const route = this.policy.decide(understanding);
    if (route.kind === 'handoff') {
      requestHandoff(turn, understanding, route.reason);
      turn.say(HANDOFF_TEXT);
      await this.finisher.finish(turn, { understanding, degradation: null });
      return;
    }
    const requireToolFirst = this.policy.requiresToolFirst(understanding);
    const run = { turn, signal: input.signal, requireToolFirst };
    const degradation = await this.respond(route, messages, run);
    const impactAsked = wasImpactAsked(input.history);
    await this.finisher.finish(turn, { understanding, degradation, impactAsked });
  }

  private async understand(messages: LlmMessage[], turn: TurnSession): Promise<Understanding> {
    const result = await this.understanding.run(messages);
    turn.metrics.add(this.deps.settings.routerModel, result.usage);
    return result.value;
  }

  private async respond(
    route: RespondableRoute,
    messages: LlmMessage[],
    run: { turn: TurnSession; signal: AbortSignal; requireToolFirst: boolean },
  ): Promise<Degradation | null> {
    const { turn, signal, requireToolFirst } = run;
    const tools = this.policy.toolsFor(route, this.deps.tools);
    const input = {
      instructions: this.prompts.response(route),
      messages,
      tools: tools.map((tool) => turn.recorder.wrap(tool)),
      requireToolFirst,
    };
    const result = await this.loop.run(input, turn.context, signal);
    turn.metrics.add(this.deps.settings.responseModel, result.usage);
    return toDegradation(result.cause);
  }
}
