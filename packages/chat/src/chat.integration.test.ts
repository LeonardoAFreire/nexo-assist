import { Module, type INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { createTestDatabase, type TestDatabase } from '@nexo/shared/database/testing';
import { RecordingEventPublisher } from './core/testing/recording-event-publisher.js';
import { ScriptedAgentApi } from './core/testing/fake-agent-api.js';
import { EchoTicketsApi } from './http/testing/echo-tickets-api.js';
import { chatTestImports } from './http/testing/chat-test-support.js';
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

async function startApp(
  testDatabase: TestDatabase,
  seedDemoData: boolean,
): Promise<INestApplicationContext> {
  const doubles = {
    database: testDatabase,
    agent: new ScriptedAgentApi(),
    tickets: new EchoTicketsApi(),
    events: new RecordingEventPublisher(),
  };
  @Module({ imports: [...chatTestImports(doubles, { seedDemoData }), ChatModule] })
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
