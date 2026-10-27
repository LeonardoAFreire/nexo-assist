import type { AgentStep, HandoffReason } from '@nexo/contracts';
import { doublePrecision, index, integer, jsonb, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import type { AgentRunOutcome } from '../core/agent-run.js';
import { agentSchema } from './agent-schema.js';

export const agentRunsTable = agentSchema.table(
  'runs',
  {
    id: uuid('id').primaryKey(),
    conversationId: uuid('conversation_id').notNull(),
    intent: text('intent'),
    confidence: doublePrecision('confidence'),
    action: text('action').notNull(),
    handoffReason: text('handoff_reason').$type<HandoffReason>(),
    steps: jsonb('steps').$type<AgentStep[]>().notNull(),
    models: text('models').array().notNull(),
    inputTokens: integer('input_tokens').notNull(),
    outputTokens: integer('output_tokens').notNull(),
    costUsd: doublePrecision('cost_usd').notNull(),
    firstTokenMs: integer('first_token_ms'),
    durationMs: integer('duration_ms').notNull(),
    outcome: text('outcome').$type<AgentRunOutcome>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    index('runs_created_at_idx').on(table.createdAt),
    index('runs_conversation_idx').on(table.conversationId),
  ],
);
