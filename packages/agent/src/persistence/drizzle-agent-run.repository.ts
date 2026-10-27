import { Inject, Injectable } from '@nestjs/common';
import { DATABASE, type Database } from '@nexo/shared/database';
import { eq, gte, sql } from 'drizzle-orm';
import type { AgentRun } from '../core/agent-run.js';
import type { AgentRunRepository } from '../core/agent-run-repository.js';
import { agentRunsTable } from './agent-runs.table.js';

type RunRow = typeof agentRunsTable.$inferInsert;

function toRow(run: AgentRun): RunRow {
  return { ...run, createdAt: new Date(run.createdAt) };
}

@Injectable()
export class DrizzleAgentRunRepository implements AgentRunRepository {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  async save(run: AgentRun): Promise<void> {
    await this.database.insert(agentRunsTable).values(toRow(run));
  }

  async costSince(since: Date): Promise<number> {
    const rows = await this.database
      .select({ total: sql<number>`coalesce(sum(${agentRunsTable.costUsd}), 0)::float8` })
      .from(agentRunsTable)
      .where(gte(agentRunsTable.createdAt, since));
    return rows[0]?.total ?? 0;
  }

  async inputTokensOf(conversationId: string): Promise<number> {
    const rows = await this.database
      .select({ total: sql<number>`coalesce(sum(${agentRunsTable.inputTokens}), 0)::int` })
      .from(agentRunsTable)
      .where(eq(agentRunsTable.conversationId, conversationId));
    return rows[0]?.total ?? 0;
  }
}
