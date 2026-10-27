import type { ChatMessage, Conversation, EmployeeConversationView } from '@nexo/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { completedEvent } from '../core/testing/agent-events.js';
import { type ChatTestApp, startChatTestApp } from './testing/chat-test-app.js';
import { type ConsoleScenario, seedConsoleScenario } from './testing/console-scenario.js';

const CONSOLE = '/console/conversations';
const UNKNOWN_ID = 'f47ac10b-58cc-4372-a567-0d02b2c3d479';
const MESSAGE_MAX_LENGTH = 2000;

type ApiError = { error: { code: string; message: string } };

let app: ChatTestApp;
let scenario: ConsoleScenario;

beforeAll(async () => {
  app = await startChatTestApp();
  scenario = await seedConsoleScenario(app);
});

afterAll(async () => {
  await app.close();
});

const action = (id: string, name: string) => `${CONSOLE}/${id}/${name}`;

describe('TI-11: assumir, responder, devolver e encerrar', () => {
  it('assume a conversa e recusa a segunda tentativa citando quem assumiu', async () => {
    const { gabriela, rafael, ids } = scenario;
    const claimed = await gabriela.json<Conversation>('POST', action(ids.waiting, 'claim'));
    const second = await rafael.json<ApiError>('POST', action(ids.waiting, 'claim'));
    expect(claimed.status).toBe(200);
    expect(claimed.body).toMatchObject({
      state: 'with_analyst',
      assignedAnalyst: { name: 'Gabriela Rocha' },
    });
    expect(second.status).toBe(409);
    expect(second.body.error).toEqual({
      code: 'conversation_already_claimed',
      message: 'Esta conversa já está sendo atendida por Gabriela Rocha.',
    });
    const view = await scenario.employees.bruno.json<EmployeeConversationView>(
      'GET',
      '/conversations/current',
    );
    expect(view.body.timeline.at(-1)?.text).toMatch(/^Gabriela Rocha assumiu · agent pausado/);
  });

  it('só um analista vence quando dois assumem ao mesmo tempo', async () => {
    const { gabriela, rafael, ids } = scenario;
    const attempts = [gabriela, rafael].map((client) =>
      client.call('POST', action(ids.waitingToo, 'claim')),
    );
    const statuses = (await Promise.all(attempts)).map((response) => response.status);
    expect([...statuses].sort((first, second) => first - second)).toEqual([200, 409]);
  });

  it('recusa assumir conversa com o agent (409) e inexistente (404)', async () => {
    const withAgent = await scenario.rafael.json<ApiError>(
      'POST',
      action(scenario.ids.agent, 'claim'),
    );
    const missing = await scenario.rafael.json<ApiError>('POST', action(UNKNOWN_ID, 'claim'));
    expect([withAgent.status, withAgent.body.error.code]).toEqual([
      409,
      'invalid_conversation_state',
    ]);
    expect([missing.status, missing.body.error.code]).toEqual([404, 'not_found']);
  });

  it('responde só quem assumiu, com nome e nível, sem assumir automaticamente', async () => {
    const { gabriela, rafael, ids } = scenario;
    const refused = await rafael.json<ApiError>('POST', action(ids.waiting, 'messages'), {
      text: 'Oi',
    });
    const sent = await gabriela.json<ChatMessage>('POST', action(ids.waiting, 'messages'), {
      text: 'Olá, Bruno.',
    });
    expect([refused.status, refused.body.error.code]).toEqual([409, 'conversation_not_claimed']);
    expect(sent.status).toBe(201);
    expect(sent.body).toMatchObject({
      author: 'analyst',
      authorName: 'Gabriela Rocha',
      authorLevel: 'N1',
    });
    const view = await scenario.employees.bruno.json<EmployeeConversationView>(
      'GET',
      '/conversations/current',
    );
    expect(view.body.timeline.map((message) => message.id)).toContain(sent.body.id);
  });

  it('valida o texto da mensagem do analista', async () => {
    const path = action(scenario.ids.waiting, 'messages');
    const bodies = [
      { text: '' },
      { text: 'x'.repeat(MESSAGE_MAX_LENGTH + 1) },
      { text: 'Oi', author: 'employee' },
    ];
    const responses = await Promise.all(
      bodies.map((body) => scenario.gabriela.call('POST', path, { body })),
    );
    expect(responses.map((response) => response.status)).toEqual([400, 400, 400]);
  });

  it('devolve ao agent só para quem assumiu e a próxima mensagem volta ao agent', async () => {
    const { gabriela, rafael, ids } = scenario;
    const refused = await rafael.json<ApiError>('POST', action(ids.waiting, 'release'));
    const released = await gabriela.json<Conversation>('POST', action(ids.waiting, 'release'));
    expect(refused.body.error.code).toBe('conversation_not_claimed');
    expect(released.body).toMatchObject({ state: 'agent', assignedAnalyst: null });
    app.agent.enqueue([completedEvent('Voltei a ajudar.')]);
    const events = await scenario.employees.bruno.send('Obrigado, e agora?');
    expect(events.map((event) => event.event)).toContain('turn.completed');
  });

  it('encerra a conversa só para quem assumiu e ela deixa de estar ativa', async () => {
    const { gabriela, rafael, ids } = scenario;
    const refused = await gabriela.json<ApiError>('POST', action(ids.claimed, 'close'));
    const closed = await rafael.json<Conversation>('POST', action(ids.claimed, 'close'));
    const again = await rafael.json<ApiError>('POST', action(ids.claimed, 'close'));
    expect(refused.body.error.code).toBe('conversation_not_claimed');
    expect(closed.body).toMatchObject({ state: 'closed', resolution: 'analyst' });
    expect(again.body.error.code).toBe('conversation_not_claimed');
    const view = await scenario.employees.carla.json<EmployeeConversationView>(
      'GET',
      '/conversations/current',
    );
    expect(view.body.conversation).toBeNull();
  });

  it('exige a origem do web nas escritas do console', async () => {
    const response = await scenario.rafael.call('POST', action(scenario.ids.agent, 'claim'), {
      origin: null,
    });
    expect(response.status).toBe(403);
  });
});
