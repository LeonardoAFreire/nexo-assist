import { parseArgs } from 'node:util';

const DEFAULT_RUNS = 3;
const MAX_RUNS = 20;
const DEFAULT_OUT_DIR = 'evals/results';
const ARGUMENT_TERMINATOR = '--';

export type EvalOptions = {
  models: string[];
  routerModel: string | undefined;
  runs: number;
  scenarios: string[];
  dryRun: boolean;
  outDir: string;
};

function parseRuns(text: string | undefined): number {
  if (text === undefined) {
    return DEFAULT_RUNS;
  }
  const runs = Number(text);
  if (!Number.isInteger(runs) || runs < 1 || runs > MAX_RUNS) {
    throw new Error(`--runs deve ser um inteiro entre 1 e ${MAX_RUNS}`);
  }
  return runs;
}

export function parseEvalOptions(argv: string[]): EvalOptions {
  const { values } = parseArgs({
    args: argv.filter((argument) => argument !== ARGUMENT_TERMINATOR),
    options: {
      model: { type: 'string', multiple: true },
      'router-model': { type: 'string' },
      runs: { type: 'string' },
      scenario: { type: 'string', multiple: true },
      'dry-run': { type: 'boolean' },
      out: { type: 'string' },
    },
  });
  return {
    models: values.model ?? [],
    routerModel: values['router-model'],
    runs: parseRuns(values.runs),
    scenarios: values.scenario ?? [],
    dryRun: values['dry-run'] ?? false,
    outDir: values.out ?? DEFAULT_OUT_DIR,
  };
}
