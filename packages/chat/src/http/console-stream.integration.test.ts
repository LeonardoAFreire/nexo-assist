import type { ConsoleConversationItem } from '@nexo/contracts';
import { finalize } from 'rxjs';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { ConversationEventsHub } from '../core/events/conversation-events-hub.js';
import { type ChatTestApp, startChatTestApp } from './testing/chat-test-app.js';
import {
  BRUNO,
  type ConsoleScenario,
  RAFAEL,
  seedConsoleScenario,
} from './testing/console-scenario.js';
import type { SseEvent } from './testing/chat-http-client.js';
import { openSse, type SseSubscription } from './testing/sse-subscription.js';

const EVENTS = '/console/events';
const NEW_MESSAGE = 'Alguém aí para me ajudar?';

let app: ChatTestApp;
let scenario: ConsoleScenario;
const subscriptions: SseSubscription[] = [];

beforeAll(async () => {
  app = await startChatTestApp();
  scenario = await seedConsoleScenario(app);
});

afterEach(() => {
  subscriptions.splice(0).forEach((subscription) => subscription.close());
});

afterAll(async () => {
  await app.close();
});

async function subscribe(query = ''): Promise<SseSubscription> {
  const cookie = await app.sessionCookie(RAFAEL!.id);
  const subscription = await openSse(`${app.baseUrl}${EVENTS}${query}`, { cookie });
  subscriptions.push(subscription);
  return subscription;
}

function itemOf(event: SseEvent): ConsoleConversationItem {
  return (event.data as { item: ConsoleConversationItem }).item;
}

function itemUpdateFor(id: string, matches: (item: ConsoleConversationItem) => boolean) {
  return (event: SseEvent) =>
    event.event === 'console.item.updated' && itemOf(event).id === id && matches(itemOf(event));
}

describe('GET /api/console/events', () => {
  it('TI-17: publica nova mensagem e mudança de estado da conversa aberta', async () => {
    const { ids, employees, gabriela } = scenario;
    const watching = await subscribe(`?conversationId=${ids.waiting}`);
    await employees.bruno.send(NEW_MESSAGE);
    const created = await watching.waitFor((event) => event.event === 'message.created');
    const withMessage = await watching.waitFor(
      itemUpdateFor(ids.waiting, (item) => item.lastMessage.preview === NEW_MESSAGE),
    );
    expect(watching.status).toBe(200);
    expect(created.data).toMatchObject({ message: { author: 'employee', text: NEW_MESSAGE } });
    expect(itemOf(withMessage)).toMatchObject({ consoleStatus: 'transferred', unreadCount: 2 });
    await gabriela.json('POST', `/console/conversations/${ids.waiting}/claim`);
    const claimed = await watching.waitFor(
      itemUpdateFor(ids.waiting, (item) => item.consoleStatus === 'attended_by_other'),
    );
    const updated = await watching.waitFor((event) => event.event === 'conversation.updated');
    expect(claimed.data).toMatchObject({ counters: { all: 4, for_you: 1, mine: 1 } });
    expect(updated.data).toMatchObject({ conversation: { id: ids.waiting } });
  });

  it('manda console.item.updated de todas as conversas, mas message.created só da aberta', async () => {
    const { ids, employees } = scenario;
    const watching = await subscribe(`?conversationId=${ids.waiting}`);
    await employees.diego.send('Mensagem da outra conversa');
    await employees.bruno.send('Mensagem da conversa aberta');
    await watching.waitFor((event) => JSON.stringify(event.data).includes('conversa aberta'));
    const names = watching.events.map((event) => event.event);
    const created = watching.events.filter((event) => event.event === 'message.created');
    const other = watching.events.some(itemUpdateFor(ids.waitingToo, () => true));
    expect(names).toContain('console.item.updated');
    expect(other).toBe(true);
    expect(JSON.stringify(created)).not.toContain('outra conversa');
  });

  it('sem conversationId só manda a atualização da lista', async () => {
    const { ids, employees } = scenario;
    const watching = await subscribe();
    await employees.bruno.send('Sem conversa aberta');
    await watching.waitFor(
      itemUpdateFor(ids.waiting, (item) => item.lastMessage.preview === 'Sem conversa aberta'),
    );
    expect(new Set(watching.events.map((event) => event.event))).toEqual(
      new Set(['console.item.updated']),
    );
  });

  it('recusa funcionário, anônimo e conversationId malformado', async () => {
    const employee = await app.sessionCookie(BRUNO!.id);
    const analyst = await app.sessionCookie(RAFAEL!.id);
    const bruno = await fetch(`${app.baseUrl}${EVENTS}`, { headers: { cookie: employee } });
    const anonymous = await fetch(`${app.baseUrl}${EVENTS}`);
    const malformed = await fetch(`${app.baseUrl}${EVENTS}?conversationId=abc`, {
      headers: { cookie: analyst },
    });
    expect([bruno.status, anonymous.status, malformed.status]).toEqual([403, 401, 400]);
  });

  it('cancela a inscrição no hub quando a conexão fecha', async () => {
    const hub = app.resolve(ConversationEventsHub);
    const original = hub.forConsole.bind(hub);
    const closed = vi.fn();
    vi.spyOn(hub, 'forConsole').mockImplementation(() => original().pipe(finalize(closed)));
    const watching = await subscribe();
    watching.close();
    await vi.waitFor(() => expect(closed).toHaveBeenCalledTimes(1));
    vi.restoreAllMocks();
  });
});
