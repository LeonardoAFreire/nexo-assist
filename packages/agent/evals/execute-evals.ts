import type { Env } from '@nexo/shared/config';
import { createLiveProvider, createRehearsalProvider } from './providers.js';
import type { EvalOptions } from './eval-options.js';
import { loadEvalConfig } from './load-eval-config.js';
import { overrideConfig } from './override-config.js';
import { type CandidateOutcome, type ProgressReporter, runCandidate } from './run-candidate.js';
import type { EvalScenario } from './types.js';

const REHEARSAL_LABEL = 'ensaio-com-roteiro';

function modelOverrides(model: string, routerModel: string | undefined): Partial<Env> {
  return routerModel === undefined
    ? { LLM_MODEL: model }
    : { LLM_MODEL: model, LLM_ROUTER_MODEL: routerModel };
}

export async function executeDryRun(
  options: EvalOptions,
  scenarios: EvalScenario[],
  onResult: ProgressReporter,
): Promise<CandidateOutcome[]> {
  const names = { model: REHEARSAL_LABEL, routerModel: REHEARSAL_LABEL };
  const candidate = { scenarios, provider: createRehearsalProvider(), runs: options.runs };
  return [await runCandidate(names, candidate, onResult)];
}

export async function executeLive(
  options: EvalOptions,
  scenarios: EvalScenario[],
  onResult: ProgressReporter,
): Promise<CandidateOutcome[]> {
  const { source, close } = await loadEvalConfig();
  try {
    const models = options.models.length > 0 ? options.models : [source.get('LLM_MODEL')];
    const outcomes: CandidateOutcome[] = [];
    for (const model of models) {
      const config = overrideConfig(source, modelOverrides(model, options.routerModel));
      const names = { model, routerModel: config.get('LLM_ROUTER_MODEL') };
      const candidate = { scenarios, provider: createLiveProvider(config), runs: options.runs };
      outcomes.push(await runCandidate(names, candidate, onResult));
    }
    return outcomes;
  } finally {
    await close();
  }
}
