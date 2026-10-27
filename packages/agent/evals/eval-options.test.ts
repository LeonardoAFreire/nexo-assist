import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseEvalOptions } from './eval-options.js';
import { saveResults } from './save-results.js';

describe('parseEvalOptions', () => {
  it('usa os padrões quando não há flags', () => {
    expect(parseEvalOptions([])).toEqual({
      models: [],
      routerModel: undefined,
      runs: 3,
      scenarios: [],
      dryRun: false,
      outDir: 'evals/results',
    });
  });

  it('aceita modelos, roteador, execuções, cenários e dry-run, ignorando o separador --', () => {
    const options = parseEvalOptions([
      '--',
      '--model',
      'a/um',
      '--model',
      'b/dois',
      '--router-model',
      'c/mini',
      '--runs',
      '5',
      '--scenario',
      'horario-atendimento',
      '--dry-run',
    ]);
    expect(options).toMatchObject({
      models: ['a/um', 'b/dois'],
      routerModel: 'c/mini',
      runs: 5,
      scenarios: ['horario-atendimento'],
      dryRun: true,
    });
  });

  it('recusa número de execuções inválido', () => {
    expect(() => parseEvalOptions(['--runs', '0'])).toThrow('--runs');
    expect(() => parseEvalOptions(['--runs', '999'])).toThrow('--runs');
    expect(() => parseEvalOptions(['--runs', 'abc'])).toThrow('--runs');
  });
});

describe('saveResults', () => {
  it('grava o JSON do resultado no diretório indicado', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'nexo-evals-'));
    try {
      const file = await saveResults(directory, {
        startedAt: '2026-10-27T12:00:00.000Z',
        dryRun: true,
        runsPerScenario: 1,
        candidates: [],
      });
      const files = await readdir(directory);
      expect(files).toHaveLength(1);
      expect(file.endsWith(files[0] as string)).toBe(true);
      expect(JSON.parse(await readFile(file, 'utf8'))).toMatchObject({
        dryRun: true,
        runsPerScenario: 1,
      });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
