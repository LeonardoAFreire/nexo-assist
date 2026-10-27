import type { TestDatabase } from '@nexo/shared/database/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EMPLOYEE_ID } from '../core/testing/factories.js';
import { DrizzleSessionUsageRepository } from './drizzle-session-usage.repository.js';
import { createMigratedDatabase } from './testing/migrated-database.js';

const SESSION_ID = 'sessao-1';
const LIMIT = 3;
const CONCURRENT_ATTEMPTS = 8;

describe('DrizzleSessionUsageRepository', () => {
  let testDatabase: TestDatabase;
  let repository: DrizzleSessionUsageRepository;
  const input = { sessionId: SESSION_ID, userId: EMPLOYEE_ID, limit: LIMIT };

  beforeEach(async () => {
    testDatabase = await createMigratedDatabase();
    repository = new DrizzleSessionUsageRepository(testDatabase.database);
  });

  afterEach(async () => {
    await testDatabase.close();
  });

  it('conta as mensagens da sessão até o limite e recusa a seguinte', async () => {
    expect(await repository.countFor(SESSION_ID)).toBe(0);
    expect(await repository.incrementBelowLimit(input)).toBe(1);
    expect(await repository.incrementBelowLimit(input)).toBe(2);
    expect(await repository.incrementBelowLimit(input)).toBe(LIMIT);
    expect(await repository.incrementBelowLimit(input)).toBeNull();
    expect(await repository.countFor(SESSION_ID)).toBe(LIMIT);
  });

  it('não ultrapassa o limite com tentativas simultâneas', async () => {
    const attempts = Array.from({ length: CONCURRENT_ATTEMPTS }, () =>
      repository.incrementBelowLimit(input),
    );
    const results = await Promise.all(attempts);
    expect(results.filter((value) => value !== null)).toHaveLength(LIMIT);
    expect(await repository.countFor(SESSION_ID)).toBe(LIMIT);
  });

  it('mantém contadores independentes por sessão', async () => {
    await repository.incrementBelowLimit(input);
    expect(await repository.incrementBelowLimit({ ...input, sessionId: 'sessao-2' })).toBe(1);
  });
});
