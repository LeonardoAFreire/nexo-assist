import type { AgentProvider } from './compose-agent.js';
import { runScenarioOnce } from './run-scenario.js';
import { summarize } from './summarize.js';
import type { EvalSummary } from './summary-types.js';
import type { EvalScenario, RunResult } from './types.js';

export type CandidateOutcome = {
  model: string;
  routerModel: string;
  results: RunResult[];
  summary: EvalSummary;
};

export type CandidateRun = {
  scenarios: EvalScenario[];
  provider: AgentProvider;
  runs: number;
};

export type ProgressReporter = (result: RunResult) => void;

export async function runResults(
  candidate: CandidateRun,
  onResult: ProgressReporter,
): Promise<RunResult[]> {
  const results: RunResult[] = [];
  for (const scenario of candidate.scenarios) {
    for (let run = 1; run <= candidate.runs; run += 1) {
      const result = await runScenarioOnce(scenario, candidate.provider, run);
      results.push(result);
      onResult(result);
    }
  }
  return results;
}

export async function runCandidate(
  names: Pick<CandidateOutcome, 'model' | 'routerModel'>,
  candidate: CandidateRun,
  onResult: ProgressReporter,
): Promise<CandidateOutcome> {
  const results = await runResults(candidate, onResult);
  return { ...names, results, summary: summarize(results) };
}
