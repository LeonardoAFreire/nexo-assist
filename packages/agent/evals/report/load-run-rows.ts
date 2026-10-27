import { gte } from 'drizzle-orm';
import type { Database } from '@nexo/shared/database';
import { agentRunsTable } from '../../src/persistence/agent-runs.table.js';
import type { RunRow } from './build-run-report.js';

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export async function loadRunRows(database: Database, days: number | null): Promise<RunRow[]> {
  const columns = {
    conversationId: agentRunsTable.conversationId,
    firstTokenMs: agentRunsTable.firstTokenMs,
    costUsd: agentRunsTable.costUsd,
    durationMs: agentRunsTable.durationMs,
    outcome: agentRunsTable.outcome,
    models: agentRunsTable.models,
  };
  const query = database.select(columns).from(agentRunsTable);
  if (days === null) {
    return query;
  }
  const since = new Date(Date.now() - days * MILLISECONDS_PER_DAY);
  return query.where(gte(agentRunsTable.createdAt, since));
}
