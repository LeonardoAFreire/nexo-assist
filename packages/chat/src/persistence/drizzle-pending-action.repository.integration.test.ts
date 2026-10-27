import type { TestDatabase } from '@nexo/shared/database/testing';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { PendingActionRecord } from '../core/pending-actions/pending-action-record.js';
import { CONVERSATION_ID, makeDraft, makeTicket, NOW_ISO } from '../core/testing/factories.js';
import { CorruptedRecordError } from './corrupted-record.error.js';
import { DrizzlePendingActionRepository } from './drizzle-pending-action.repository.js';
import { pendingActionsTable } from './pending-actions.table.js';
import { createMigratedDatabase } from './testing/migrated-database.js';

const FIRST_ACTION_ID = '5d0c0000-0000-4000-8000-000000000001';
const SECOND_ACTION_ID = '5d0c0000-0000-4000-8000-000000000002';
const OTHER_CONVERSATION_ID = 'c71a2b3c-1d2e-4f50-8a61-7b8c9d0e1f21';

function makeRecord(id: string, conversationId = CONVERSATION_ID): PendingActionRecord {
  return {
    id,
    conversationId,
    displayNumber: 'D-381',
    kind: 'create_ticket',
    status: 'pending',
    draft: makeDraft(),
    targetNumber: null,
    complement: null,
    resultTicket: null,
    confirmedVia: null,
    createdAt: NOW_ISO,
    resolvedAt: null,
  };
}

describe('DrizzlePendingActionRepository', () => {
  let testDatabase: TestDatabase;
  let repository: DrizzlePendingActionRepository;

  beforeEach(async () => {
    testDatabase = await createMigratedDatabase();
    repository = new DrizzlePendingActionRepository(testDatabase.database);
  });

  afterEach(async () => {
    await testDatabase.close();
  });

  it('recusa uma segunda ação pendente na mesma conversa', async () => {
    await repository.save(makeRecord(FIRST_ACTION_ID));
    await expect(repository.save(makeRecord(SECOND_ACTION_ID))).rejects.toThrow();
    await repository.save(makeRecord(SECOND_ACTION_ID, OTHER_CONVERSATION_ID));
  });

  it('aceita nova ação pendente depois que a anterior foi resolvida', async () => {
    const first = makeRecord(FIRST_ACTION_ID);
    await repository.save(first);
    await repository.save({ ...first, status: 'superseded', resolvedAt: NOW_ISO });
    await repository.save(makeRecord(SECOND_ACTION_ID));
    expect((await repository.findPendingByConversation(CONVERSATION_ID))?.id).toBe(
      SECOND_ACTION_ID,
    );
  });

  it('grava o resultado da confirmação com o chamado criado', async () => {
    const confirmed: PendingActionRecord = {
      ...makeRecord(FIRST_ACTION_ID),
      status: 'confirmed',
      confirmedVia: 'button',
      resultTicket: makeTicket(),
      resolvedAt: NOW_ISO,
    };
    await repository.save(confirmed);
    expect(await repository.findById(FIRST_ACTION_ID)).toEqual(confirmed);
    expect(await repository.findPendingByConversation(CONVERSATION_ID)).toBeNull();
  });

  it('numera as ações em sequência a partir de D-381', async () => {
    expect(await repository.nextDisplayNumber()).toBe('D-381');
    expect(await repository.nextDisplayNumber()).toBe('D-382');
  });

  it('falha de forma explícita quando o jsonb do rascunho está corrompido', async () => {
    await repository.save(makeRecord(FIRST_ACTION_ID));
    await testDatabase.database
      .update(pendingActionsTable)
      .set({ payload: { draft: 'texto solto' } })
      .where(eq(pendingActionsTable.id, FIRST_ACTION_ID));
    await expect(repository.findById(FIRST_ACTION_ID)).rejects.toBeInstanceOf(CorruptedRecordError);
  });
});
