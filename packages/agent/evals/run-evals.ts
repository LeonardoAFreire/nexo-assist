import { executeDryRun, executeLive } from './execute-evals.js';
import { exitAfterFlush } from './exit-after-flush.js';
import { parseEvalOptions } from './eval-options.js';
import { renderEvalSummary } from './render-summary.js';
import type { CandidateOutcome } from './run-candidate.js';
import { saveResults } from './save-results.js';
import { selectScenarios } from './scenarios/index.js';
import type { RunResult } from './types.js';

function printResult(result: RunResult): void {
  const verdict = result.passed ? 'aprovado' : 'reprovado';
  process.stdout.write(`${result.scenarioId} #${result.run}: ${verdict}\n`);
}

function printOutcome(outcome: CandidateOutcome): void {
  const title = `modelo ${outcome.model} / roteador ${outcome.routerModel}`;
  process.stdout.write(`\n${renderEvalSummary(title, outcome.summary)}\n`);
}

function hasFailure(outcomes: CandidateOutcome[]): boolean {
  return outcomes.some((outcome) => outcome.results.some((result) => !result.passed));
}

async function main(): Promise<void> {
  const options = parseEvalOptions(process.argv.slice(2));
  const scenarios = selectScenarios(options.scenarios);
  const startedAt = new Date().toISOString();
  const execute = options.dryRun ? executeDryRun : executeLive;
  const candidates = await execute(options, scenarios, printResult);
  candidates.forEach(printOutcome);
  const runsPerScenario = options.runs;
  const file = await saveResults(options.outDir, {
    startedAt,
    dryRun: options.dryRun,
    runsPerScenario,
    candidates,
  });
  process.stdout.write(`Resultado salvo em ${file}\n`);
  if (options.dryRun && hasFailure(candidates)) {
    process.exitCode = 1;
  }
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'erro desconhecido';
    process.stderr.write(`Falha nos evals: ${message}\n`);
    process.exitCode = 1;
  })
  .finally(exitAfterFlush);
