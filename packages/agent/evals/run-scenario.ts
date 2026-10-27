import { randomUUID } from 'node:crypto';
import type { AgentTurnEvent, AgentTurnInput } from '@nexo/contracts';
import type { AgentRun } from '../src/core/agent-run.js';
import { type AgentProvider, type EvalAgent } from './compose-agent.js';
import { universalCriteria } from './criteria/index.js';
import { evalArticles } from './fixtures/articles.js';
import { buildEvalWorld, type EvalRequester } from './fixtures/build-eval-world.js';
import { EvalKnowledgeApi } from './fixtures/eval-knowledge-api.js';
import { EvalTicketsApi } from './fixtures/eval-tickets-api.js';
import { observeTurn } from './observe-turn.js';
import { allPassed, scoreObservation } from './score-observation.js';
import type { EvalScenario, RunMetrics, RunResult } from './types.js';

const RUN_TIMEOUT_MS = 120_000;
const EMPTY_METRICS: RunMetrics = {
  firstTokenMs: null,
  durationMs: null,
  costUsd: 0,
  inputTokens: 0,
  outputTokens: 0,
  models: [],
};

async function collectEvents(agent: EvalAgent, input: AgentTurnInput): Promise<AgentTurnEvent[]> {
  const events: AgentTurnEvent[] = [];
  for await (const event of agent.respond(input)) {
    events.push(event);
  }
  return events;
}

function toMetrics(run: AgentRun | undefined): RunMetrics {
  if (run === undefined) {
    return EMPTY_METRICS;
  }
  const { firstTokenMs, durationMs, costUsd, inputTokens, outputTokens, models } = run;
  return { firstTokenMs, durationMs, costUsd, inputTokens, outputTokens, models };
}

function buildTurnInput(scenario: EvalScenario, requester: EvalRequester): AgentTurnInput {
  return {
    conversationId: randomUUID(),
    requester,
    history: scenario.history,
    pendingAction: null,
    userMessage: scenario.userMessage,
    signal: AbortSignal.timeout(RUN_TIMEOUT_MS),
  };
}

export async function runScenarioOnce(
  scenario: EvalScenario,
  provider: AgentProvider,
  run: number,
): Promise<RunResult> {
  const { requester, owned, world } = buildEvalWorld(scenario.requester, new Date());
  const tickets = new EvalTicketsApi(owned, new Date());
  const agent = provider(scenario, { tickets, knowledge: new EvalKnowledgeApi(evalArticles) });
  const events = await collectEvents(agent, buildTurnInput(scenario, requester));
  const observation = observeTurn(events, tickets.writeCalls);
  const criteria = scoreObservation(
    [...universalCriteria(world), ...scenario.criteria],
    observation,
  );
  return {
    scenarioId: scenario.id,
    goal: scenario.goal,
    run,
    passed: allPassed(criteria),
    criteria,
    metrics: toMetrics(agent.runs.saved[0]),
    stepKinds: observation.stepKinds,
    failureCode: observation.failureCode,
  };
}
