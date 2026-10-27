import { millisecondsText, padRight, percentText, usdText, verdictText } from './format.js';
import {
  CONVERSATION_COST_TARGET_USD,
  FIRST_TOKEN_P50_TARGET_MS,
  FIRST_TOKEN_P95_TARGET_MS,
  TYPICAL_CONVERSATION_MESSAGES,
} from './goal-targets.js';
import type { EvalSummary, GoalOutcome, ScenarioSummary } from './summary-types.js';

const SCENARIO_COLUMN = 30;
const GOAL_COLUMN = 18;
const RESULT_COLUMN = 14;
const NO_SCENARIOS_TEXT = 'sem cenários nesta execução';

function scenarioLine(scenario: ScenarioSummary): string {
  const rate = percentText(scenario.passedRuns / scenario.runs);
  const result = `${scenario.passedRuns}/${scenario.runs} (${rate})`;
  const failed = scenario.failedCriteria.join(', ');
  const cells = [
    padRight(scenario.scenarioId, SCENARIO_COLUMN),
    padRight(scenario.goal, GOAL_COLUMN),
    padRight(result, RESULT_COLUMN),
  ];
  return `${cells.join('')}${failed}`.trimEnd();
}

function goalLine(outcome: GoalOutcome): string {
  const cells = [
    padRight(outcome.label, SCENARIO_COLUMN),
    padRight(percentText(outcome.rate), GOAL_COLUMN),
    padRight(`meta ${percentText(outcome.minRate)}`, RESULT_COLUMN),
  ];
  const verdict = outcome.rate === null ? NO_SCENARIOS_TEXT : verdictText(outcome.met);
  return `${cells.join('')}${verdict}`;
}

function performanceLines(summary: EvalSummary): string[] {
  const { firstTokenP50Ms, firstTokenP95Ms, averageCostUsd } = summary.performance;
  const conversationCost = averageCostUsd * TYPICAL_CONVERSATION_MESSAGES;
  const costMet = conversationCost <= CONVERSATION_COST_TARGET_USD;
  const p50Met = firstTokenP50Ms !== null && firstTokenP50Ms <= FIRST_TOKEN_P50_TARGET_MS;
  const p95Met = firstTokenP95Ms !== null && firstTokenP95Ms <= FIRST_TOKEN_P95_TARGET_MS;
  return [
    `Primeiro trecho p50: ${millisecondsText(firstTokenP50Ms)} (meta ${FIRST_TOKEN_P50_TARGET_MS} ms): ${verdictText(p50Met)}`,
    `Primeiro trecho p95: ${millisecondsText(firstTokenP95Ms)} (meta ${FIRST_TOKEN_P95_TARGET_MS} ms): ${verdictText(p95Met)}`,
    `Custo médio por execução: ${usdText(averageCostUsd)}`,
    `Estimativa para ${TYPICAL_CONVERSATION_MESSAGES} mensagens: ${usdText(conversationCost)} (meta ${usdText(CONVERSATION_COST_TARGET_USD)}): ${verdictText(costMet)}`,
  ];
}

export function renderEvalSummary(title: string, summary: EvalSummary): string {
  return [
    `== ${title} ==`,
    '',
    ...summary.scenarios.map(scenarioLine),
    '',
    ...summary.goals.map(goalLine),
    '',
    ...performanceLines(summary),
    '',
  ].join('\n');
}
