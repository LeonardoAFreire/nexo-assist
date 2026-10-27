import { Inject, Injectable } from '@nestjs/common';
import { DATABASE, type Database } from '@nexo/shared/database';
import { and, eq, sql } from 'drizzle-orm';
import type { PendingActionRecord } from '../core/pending-actions/pending-action-record.js';
import type { PendingActionRepository } from '../core/pending-actions/pending-action-repository.js';
import { toPendingActionRecord, toPendingActionRow } from './pending-action-mapper.js';
import { DISPLAY_NUMBER_SEQUENCE, pendingActionsTable } from './pending-actions.table.js';
import { CHAT_SCHEMA } from './chat-schema.js';

const DISPLAY_NUMBER_PREFIX = 'D-';
const SEQUENCE_NAME = `${CHAT_SCHEMA}.${DISPLAY_NUMBER_SEQUENCE}`;
const nextSequenceValue = sql`select nextval(${SEQUENCE_NAME}::regclass)::text as value`;

type SequenceResult = { rows: { value: string }[] };

@Injectable()
export class DrizzlePendingActionRepository implements PendingActionRepository {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  async nextDisplayNumber(): Promise<string> {
    const result = await this.database.execute(nextSequenceValue);
    const { rows } = result as unknown as SequenceResult;
    return `${DISPLAY_NUMBER_PREFIX}${rows[0]?.value ?? ''}`;
  }

  async save(record: PendingActionRecord): Promise<void> {
    const row = toPendingActionRow(record);
    await this.database
      .insert(pendingActionsTable)
      .values(row)
      .onConflictDoUpdate({ target: pendingActionsTable.id, set: row });
  }

  async findById(id: string): Promise<PendingActionRecord | null> {
    const rows = await this.database
      .select()
      .from(pendingActionsTable)
      .where(eq(pendingActionsTable.id, id));
    const row = rows[0];
    return row === undefined ? null : toPendingActionRecord(row);
  }

  async findPendingByConversation(conversationId: string): Promise<PendingActionRecord | null> {
    const rows = await this.database
      .select()
      .from(pendingActionsTable)
      .where(
        and(
          eq(pendingActionsTable.conversationId, conversationId),
          eq(pendingActionsTable.status, 'pending'),
        ),
      );
    const row = rows[0];
    return row === undefined ? null : toPendingActionRecord(row);
  }
}
