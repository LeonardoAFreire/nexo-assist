import type { EvalGoal } from './types.js';

export type ScenarioSummary = {
  scenarioId: string;
  goal: EvalGoal;
  runs: number;
  passedRuns: number;
  failedCriteria: string[];
};

export type GoalOutcome = {
  goal: EvalGoal;
  label: string;
  rate: number | null;
  minRate: number;
  met: boolean;
};

export type PerformanceSummary = {
  firstTokenP50Ms: number | null;
  firstTokenP95Ms: number | null;
  averageCostUsd: number;
  averageDurationMs: number;
};

export type EvalSummary = {
  scenarios: ScenarioSummary[];
  goals: GoalOutcome[];
  performance: PerformanceSummary;
};
