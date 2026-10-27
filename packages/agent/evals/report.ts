import { parseArgs } from 'node:util';
import { DATABASE, type Database } from '@nexo/shared/database';
import { exitAfterFlush } from './exit-after-flush.js';
import { buildRunReport } from './report/build-run-report.js';
import { loadRunRows } from './report/load-run-rows.js';
import { openReportContext } from './report/open-report-context.js';
import { renderRunReport } from './report/render-run-report.js';

const ARGUMENT_TERMINATOR = '--';

function parseDays(argv: string[]): number | null {
  const args = argv.filter((argument) => argument !== ARGUMENT_TERMINATOR);
  const { values } = parseArgs({ args, options: { days: { type: 'string' } } });
  if (values.days === undefined) {
    return null;
  }
  const days = Number(values.days);
  if (!Number.isFinite(days) || days <= 0) {
    throw new Error('--days deve ser um número positivo');
  }
  return days;
}

async function main(): Promise<void> {
  const days = parseDays(process.argv.slice(2));
  const context = await openReportContext();
  try {
    const rows = await loadRunRows(context.get<Database>(DATABASE), days);
    process.stdout.write(`${renderRunReport(buildRunReport(rows))}\n`);
  } finally {
    await context.close();
  }
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'erro desconhecido';
    process.stderr.write(`Falha no relatório: ${message}\n`);
    process.exitCode = 1;
  })
  .finally(exitAfterFlush);
