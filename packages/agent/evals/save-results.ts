import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { CandidateOutcome } from './run-candidate.js';

const JSON_INDENT = 2;
const TIMESTAMP_UNSAFE = /[:.]/g;

export type SavedEval = {
  startedAt: string;
  dryRun: boolean;
  runsPerScenario: number;
  candidates: CandidateOutcome[];
};

export async function saveResults(outDir: string, evalRun: SavedEval): Promise<string> {
  const directory = resolve(outDir);
  await mkdir(directory, { recursive: true });
  const stamp = evalRun.startedAt.replace(TIMESTAMP_UNSAFE, '-');
  const prefix = evalRun.dryRun ? 'dry-run' : 'eval';
  const file = join(directory, `${prefix}-${stamp}.json`);
  await writeFile(file, JSON.stringify(evalRun, null, JSON_INDENT), 'utf8');
  return file;
}
