import type { TestDatabase } from '@nexo/shared/database/testing';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Conversation } from '../core/conversation/conversation.js';
import { CONVERSATION_ID, EMPLOYEE_ID, NOW_ISO } from '../core/testing/factories.js';
import { makeHandoffInfo } from '../core/testing/conversation-seeds.js';
import { CorruptedRecordError } from './corrupted-record.error.js';
import { conversationsTable } from './conversations.table.js';
import { DrizzleConversationRepository } from './drizzle-conversation.repository.js';
import { createMigratedDatabase } from './testing/migrated-database.js';

const OTHER_CONVERSATION_ID = 'c71a2b3c-1d2e-4f50-8a61-7b8c9d0e1f21';
const ANALYST_ID = 'a1b2c3d4-0000-4000-8000-000000000001';
const LOCK_UNTIL = '2026-10-26T13:06:00.000Z';
const AFTER_LOCK = '2026-10-26T13:07:00.000Z';

const UNKNOWN_ID = '00000000-0000-4000-8000-000000000000';

describe('DrizzleConversationRepository', () => {
  let testDatabase: TestDatabase;
  let repository: DrizzleConversationRepository;

  beforeEach(async () => {
    testDatabase = await createMigratedDatabase();
    repository = new DrizzleConversationRepository(testDatabase.database);
  });

  afterEach(async () => {
    await testDatabase.close();
  });

  function open(id = CONVERSATION_ID): Conversation {
    return Conversation.open({ id, employeeId: EMPLOYEE_ID, now: NOW_ISO });
  }

  it('grava e lê a conversa com a transferência', async () => {
    const waiting = open().handOff(makeHandoffInfo());
    await repository.save(waiting);
    const found = await repository.findById(CONVERSATION_ID);
    expect(found?.props).toEqual(waiting.props);
    expect(await repository.findActiveByEmployee(EMPLOYEE_ID)).not.toBeNull();
  });

  it('recusa uma segunda conversa ativa do mesmo funcionário', async () => {
    await repository.save(open());
    await expect(repository.save(open(OTHER_CONVERSATION_ID))).rejects.toThrow();
  });

  it('permite nova conversa depois que a anterior foi encerrada', async () => {
    await repository.save(open().closeByAgent(NOW_ISO));
    await repository.save(open(OTHER_CONVERSATION_ID));
    expect(await repository.listByEmployee(EMPLOYEE_ID)).toHaveLength(2);
    expect((await repository.findActiveByEmployee(EMPLOYEE_ID))?.id).toBe(OTHER_CONVERSATION_ID);
  });

  it('assume a conversa condicionalmente uma única vez', async () => {
    const waiting = open().handOff(makeHandoffInfo());
    await repository.save(waiting);
    const claimed = waiting.claim(ANALYST_ID);
    const input = { conversation: claimed, expectedState: 'waiting_analyst' as const };
    expect(await repository.saveWhenState(input)).toBe(true);
    expect(await repository.saveWhenState(input)).toBe(false);
    expect((await repository.findById(CONVERSATION_ID))?.state).toBe('with_analyst');
  });

  it('trava o turno uma vez e libera depois do prazo ou da liberação', async () => {
    await repository.save(open());
    const lock = { conversationId: CONVERSATION_ID, now: NOW_ISO, until: LOCK_UNTIL };
    expect((await repository.acquireTurnLock(lock))?.props.turnLockUntil).toBe(LOCK_UNTIL);
    expect(await repository.acquireTurnLock(lock)).toBeNull();
    expect(await repository.acquireTurnLock({ ...lock, now: AFTER_LOCK })).not.toBeNull();
    await repository.releaseTurnLock(CONVERSATION_ID);
    expect(await repository.acquireTurnLock(lock)).not.toBeNull();
  });

  it('grava só a leitura do analista, sem tocar no travamento nem no estado', async () => {
    await repository.save(open());
    const lock = { conversationId: CONVERSATION_ID, now: NOW_ISO, until: LOCK_UNTIL };
    await repository.acquireTurnLock(lock);
    const read = await repository.markAnalystRead(CONVERSATION_ID, NOW_ISO);
    expect(read?.props.analystReadAt).toBe(NOW_ISO);
    expect(read?.props.turnLockUntil).toBe(LOCK_UNTIL);
    expect(await repository.markAnalystRead(UNKNOWN_ID, NOW_ISO)).toBeNull();
  });

  it('falha de forma explícita quando o jsonb da transferência está corrompido', async () => {
    await repository.save(open());
    await testDatabase.database
      .update(conversationsTable)
      .set({ handoff: { reason: 'inventado' } })
      .where(eq(conversationsTable.id, CONVERSATION_ID));
    await expect(repository.findById(CONVERSATION_ID)).rejects.toBeInstanceOf(CorruptedRecordError);
  });
});
