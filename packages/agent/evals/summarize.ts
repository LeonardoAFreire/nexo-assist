import { goalRate } from './goal-rates.js';
import { GOAL_TARGETS } from './goal-targets.js';
import { average, percentile } from './percentile.js';
import type {
  EvalSummary,
  GoalOutcome,
  PerformanceSummary,
  ScenarioSummary,
} from './summary-types.js';
import type { RunResult } from './types.js';

const MEDIAN_RATIO = 0.5;
const P95_RATIO = 0.95;

function summarizeScenario(scenarioId: string, results: RunResult[]): ScenarioSummary {
  const runs = results.filter((result) => result.scenarioId === scenarioId);
  const failed = runs.flatMap((run) => run.criteria.filter((item) => !item.passed));
  return {
    scenarioId,
    goal: runs[0]?.goal ?? 'resolution',
    runs: runs.length,
    passedRuns: runs.filter((run) => run.passed).length,
    failedCriteria: [...new Set(failed.map((item) => item.id))],
  };
}

function summarizeGoals(results: RunResult[]): GoalOutcome[] {
  return GOAL_TARGETS.map(({ goal, label, minRate }) => {
    const rate = goalRate(results, goal);
    return { goal, label, rate, minRate, met: rate !== null && rate >= minRate };
  });
}

function summarizePerformance(results: RunResult[]): PerformanceSummary {
  const firstTokens = results.flatMap((result) => result.metrics.firstTokenMs ?? []);
  return {
    firstTokenP50Ms: percentile(firstTokens, MEDIAN_RATIO),
    firstTokenP95Ms: percentile(firstTokens, P95_RATIO),
    averageCostUsd: average(results.map((result) => result.metrics.costUsd)),
    averageDurationMs: average(results.flatMap((result) => result.metrics.durationMs ?? [])),
  };
}

export function summarize(results: RunResult[]): EvalSummary {
  const ids = [...new Set(results.map((result) => result.scenarioId))];
  return {
    scenarios: ids.map((scenarioId) => summarizeScenario(scenarioId, results)),
    goals: summarizeGoals(results),
    performance: summarizePerformance(results),
  };
}
