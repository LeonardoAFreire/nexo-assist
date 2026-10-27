import { Inject, Injectable } from '@nestjs/common';
import { DATABASE, type Database } from '@nexo/shared/database';
import { eq, lt, sql } from 'drizzle-orm';
import type {
  IncrementUsageInput,
  SessionUsageRepository,
} from '../core/allowance/session-usage-repository.js';
import { sessionUsageTable } from './session-usage.table.js';

const FIRST_MESSAGE = 1;

@Injectable()
export class DrizzleSessionUsageRepository implements SessionUsageRepository {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  async countFor(sessionId: string): Promise<number> {
    const rows = await this.database
      .select({ used: sessionUsageTable.employeeMessages })
      .from(sessionUsageTable)
      .where(eq(sessionUsageTable.sessionId, sessionId));
    return rows[0]?.used ?? 0;
  }

  async incrementBelowLimit(input: IncrementUsageInput): Promise<number | null> {
    if (input.limit < FIRST_MESSAGE) {
      return null;
    }
    const rows = await this.database
      .insert(sessionUsageTable)
      .values({
        sessionId: input.sessionId,
        userId: input.userId,
        employeeMessages: FIRST_MESSAGE,
      })
      .onConflictDoUpdate({
        target: sessionUsageTable.sessionId,
        set: { employeeMessages: sql`${sessionUsageTable.employeeMessages} + 1` },
        setWhere: lt(sessionUsageTable.employeeMessages, input.limit),
      })
      .returning({ used: sessionUsageTable.employeeMessages });
    return rows[0]?.used ?? null;
  }
}
