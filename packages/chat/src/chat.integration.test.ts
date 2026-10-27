import { Global, Module, type INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppConfig } from '@nexo/shared/config';
import { DATABASE } from '@nexo/shared/database';
import { createTestDatabase, type TestDatabase } from '@nexo/shared/database/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ChatModule } from './chat.module.js';
import {
  CONVERSATION_REPOSITORY,
  type ConversationRepository,
} from './core/conversation/conversation-repository.js';
import { MESSAGE_REPOSITORY, type MessageRepository } from './core/messages/message-repository.js';

const SEEDED_CONVERSATIONS = 4;
const HISTORY_LIMIT = 100;

function compareText(first: string, second: string): number {
  return first.localeCompare(second);
}

function buildSupportModule(testDatabase: TestDatabase, seed: boolean) {
  @Global()
  @Module({
    providers: [
      { provide: DATABASE, useValue: testDatabase.database },
      { provide: AppConfig, useValue: { get: () => seed } },
    ],
    exports: [DATABASE, AppConfig],
  })
  class SupportModule {}
  return SupportModule;
}

async function startApp(
  testDatabase: TestDatabase,
  seed: boolean,
): Promise<INestApplicationContext> {
  @Module({ imports: [buildSupportModule(testDatabase, seed), ChatModule] })
  class TestAppModule {}
  return NestFactory.createApplicationContext(TestAppModule, { logger: false });
}

describe('ChatModule', () => {
  let testDatabase: TestDatabase;

  beforeEach(async () => {
    testDatabase = await createTestDatabase();
  });

  afterEach(async () => {
    await testDatabase.close();
  });

  it('carrega as 4 conversas do console em estados variados', async () => {
    const app = await startApp(testDatabase, true);
    const conversations = app.get<ConversationRepository>(CONVERSATION_REPOSITORY);
    const all = await conversations.listAll();
    expect(all).toHaveLength(SEEDED_CONVERSATIONS);
    const states = all.map((conversation) => conversation.state);
    const resolutions = all.map((conversation) => conversation.props.resolution);
    expect(states.sort(compareText)).toEqual(['agent', 'closed', 'closed', 'waiting_analyst']);
    expect(resolutions.filter((value) => value !== null).sort(compareText)).toEqual([
      'agent',
      'analyst',
    ]);
    await app.close();
  });

  it('mantém as conversas e mensagens depois de reiniciar sem duplicar a seed', async () => {
    const first = await startApp(testDatabase, true);
    await first.close();
    const second = await startApp(testDatabase, true);
    const conversations = second.get<ConversationRepository>(CONVERSATION_REPOSITORY);
    const messages = second.get<MessageRepository>(MESSAGE_REPOSITORY);
    const all = await conversations.listAll();
    const history = await messages.listRecentByConversations({
      conversationIds: all.map((conversation) => conversation.id),
      limit: HISTORY_LIMIT,
    });
    expect(all).toHaveLength(SEEDED_CONVERSATIONS);
    expect(history.length).toBeGreaterThan(SEEDED_CONVERSATIONS);
    await second.close();
  });

  it('não carrega a seed quando SEED_DEMO_DATA é falso', async () => {
    const app = await startApp(testDatabase, false);
    const conversations = app.get<ConversationRepository>(CONVERSATION_REPOSITORY);
    expect(await conversations.listAll()).toEqual([]);
    await app.close();
  });
});
