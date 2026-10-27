import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  DEMO_EMPLOYEES,
  type EmployeeConversationView,
  type PendingAction,
  type TicketDetail,
} from '@nexo/contracts';
import { createTestDatabase, type TestDatabase } from '@nexo/shared/database/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startWiringApp, WIRING_WEB_ORIGIN, type WiringApp } from './testing/wiring-app.js';

const ANA = DEMO_EMPLOYEES[0]!;
const CITED_TICKET = 'INC-20311';
const EMPLOYEE_TURNS = [
  `Pode me mostrar o ${CITED_TICKET}?`,
  'Minha VPN está com erro 809 e não conecto',
  'Windows 11',
  'Só eu',
  'Sim, não consigo trabalhar',
];

let dataDirectory: string;
let database: TestDatabase | undefined;
let running: WiringApp | undefined;

function jsonHeaders(cookie: string): Record<string, string> {
  return { 'content-type': 'application/json', origin: WIRING_WEB_ORIGIN, cookie };
}

async function boot(): Promise<void> {
  database = await createTestDatabase(dataDirectory);
  running = await startWiringApp(database.database);
}

async function shutdown(): Promise<void> {
  await running?.app.close();
  await database?.close();
  running = undefined;
  database = undefined;
}

async function loginAsAna(): Promise<string> {
  const response = await fetch(`${running?.baseUrl}/auth/login`, {
    method: 'POST',
    headers: jsonHeaders(''),
    body: JSON.stringify({ email: ANA.email, password: 'qualquer' }),
  });
  return (response.headers.getSetCookie()[0] ?? '').split(';')[0] ?? '';
}

async function say(cookie: string, text: string): Promise<void> {
  const url = `${running?.baseUrl}/conversations/current/messages`;
  const response = await fetch(url, {
    method: 'POST',
    headers: jsonHeaders(cookie),
    body: JSON.stringify({ text }),
  });
  expect(await response.text()).toContain('event: turn.completed');
}

async function currentView(cookie: string): Promise<EmployeeConversationView> {
  const response = await fetch(`${running?.baseUrl}/conversations/current`, {
    headers: jsonHeaders(cookie),
  });
  return (await response.json()) as EmployeeConversationView;
}

async function interruptLastTurn(): Promise<void> {
  await database?.database.execute(
    "delete from chat.messages where id = (select id from chat.messages where author = 'agent' order by created_at desc limit 1)",
  );
  await database?.database.execute(
    "update chat.conversations set turn_lock_until = now() + interval '2 minutes' where state <> 'closed'",
  );
}

function pendingDraftOf(view: EmployeeConversationView): PendingAction | undefined {
  const parts = view.timeline.flatMap((message) => message.parts);
  const actions = parts.flatMap((part) => (part.type === 'pending_action' ? [part.action] : []));
  return actions.find((action) => action.status === 'pending');
}

beforeAll(() => {
  dataDirectory = mkdtempSync(join(tmpdir(), 'nexo-restart-'));
});

afterAll(async () => {
  await shutdown();
  rmSync(dataDirectory, { recursive: true, force: true });
});

describe('reinício da aplicação sobre o mesmo banco', () => {
  it('TI-14: mantém histórico, cards, rascunho pendente e estado após reiniciar', async () => {
    await boot();
    const cookie = await loginAsAna();
    for (const text of EMPLOYEE_TURNS) {
      await say(cookie, text);
    }
    const before = await currentView(cookie);
    const draft = pendingDraftOf(before);
    expect(draft?.draft?.title).toBe('VPN com erro 809 ao conectar');
    expect(before.timeline.flatMap((message) => message.parts).map((part) => part.type)).toContain(
      'ticket_card',
    );
    await shutdown();
    await boot();
    const after = await currentView(cookie);
    expect(after).toEqual(before);
    const confirmed = await fetch(
      `${running?.baseUrl}/conversations/current/pending-actions/${draft?.id}/confirm`,
      { method: 'POST', headers: jsonHeaders(cookie), body: JSON.stringify({ via: 'button' }) },
    );
    expect(confirmed.status).toBe(200);
    const created = await fetch(`${running?.baseUrl}/tickets`, { headers: jsonHeaders(cookie) });
    const titles = ((await created.json()) as TicketDetail[]).map((ticket) => ticket.title);
    expect(titles).toContain('VPN com erro 809 ao conectar');
  });

  it('libera a conversa e permite refazer a resposta de um turno cortado pela queda', async () => {
    await shutdown();
    await boot();
    const cookie = await loginAsAna();
    await say(cookie, 'Como está o INC-20311?');
    await interruptLastTurn();
    await shutdown();
    await boot();
    const view = await currentView(cookie);
    expect(view.turnInProgress).toBe(false);
    expect(view.timeline.at(-1)).toMatchObject({ author: 'agent', status: 'failed' });
    const retried = await fetch(`${running?.baseUrl}/conversations/current/turns/retry`, {
      method: 'POST',
      headers: jsonHeaders(cookie),
    });
    expect(await retried.text()).toContain('event: turn.completed');
  });
});
