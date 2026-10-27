import { DEMO_ANALYSTS, DEMO_EMPLOYEES, type EmployeeConversationView } from '@nexo/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { completedEvent, makeDecision, makeStep } from '../core/testing/agent-events.js';
import { chatClient, type ChatHttpClient } from './testing/chat-http-client.js';
import { type ChatTestApp, startChatTestApp } from './testing/chat-test-app.js';

const ANA = DEMO_EMPLOYEES[0]!;
const BRUNO = DEMO_EMPLOYEES[1]!;
const RAFAEL = DEMO_ANALYSTS[0]!;
const MESSAGES = '/conversations/current/messages';
const SESSION_MESSAGE_LIMIT = 30;
const TOO_MANY_REQUESTS = 429;

let app: ChatTestApp;
let ana: ChatHttpClient;
let bruno: ChatHttpClient;
let analyst: ChatHttpClient;

beforeAll(async () => {
  app = await startChatTestApp();
  ana = chatClient(app, await app.sessionCookie(ANA.id));
  bruno = chatClient(app, await app.sessionCookie(BRUNO.id));
  analyst = chatClient(app, await app.sessionCookie(RAFAEL.id));
});

afterAll(async () => {
  await app.close();
});

function errorCode(body: unknown): unknown {
  return (body as { error: { code: string } }).error.code;
}

describe('acesso à conversa do funcionário', () => {
  it('devolve a visão vazia para quem ainda não conversou', async () => {
    const { status, body } = await bruno.json<EmployeeConversationView>(
      'GET',
      '/conversations/current',
    );
    expect(status).toBe(200);
    expect(body).toEqual({
      conversation: null,
      timeline: [],
      usage: { messagesUsed: 0, messagesLimit: SESSION_MESSAGE_LIMIT },
      turnInProgress: false,
    });
  });

  it('exige sessão, papel de funcionário e a origem do web nas escritas', async () => {
    const anonymous = await ana.call('GET', '/conversations/current', { cookie: '' });
    const forbidden = await analyst.call('GET', '/conversations/current');
    const foreignOrigin = await ana.call('POST', MESSAGES, { body: { text: 'oi' }, origin: null });
    expect([anonymous.status, forbidden.status, foreignOrigin.status]).toEqual([401, 403, 403]);
    expect(app.agent.inputs).toHaveLength(0);
  });
});

describe('TI-04: identidade só da sessão', () => {
  it.each(['requesterId', 'userId'])('recusa %s de outro usuário no corpo', async (field) => {
    const before = app.agent.inputs.length;
    const { status, body } = await ana.json('POST', MESSAGES, { text: 'oi', [field]: BRUNO.id });
    expect(status).toBe(400);
    expect(errorCode(body)).toBe('validation_error');
    expect(app.agent.inputs).toHaveLength(before);
  });

  it('usa o funcionário da sessão e não deixa um usuário ver a conversa de outro', async () => {
    app.agent.enqueue([completedEvent('Olá, Ana.')]);
    const events = await ana.send('Oi, preciso de ajuda');
    expect(events.map((event) => event.event)).toEqual(['message.accepted', 'turn.completed']);
    expect(app.agent.inputs.at(-1)?.requester).toMatchObject({ id: ANA.id, name: ANA.name });
    const own = await ana.json<EmployeeConversationView>('GET', '/conversations/current');
    const foreign = await bruno.json<EmployeeConversationView>('GET', '/conversations/current');
    expect(own.body.conversation?.employee.id).toBe(ANA.id);
    expect(own.body.timeline).toHaveLength(2);
    expect(foreign.body.conversation).toBeNull();
    expect(foreign.body.timeline).toEqual([]);
  });
});

describe('TI-05: turno por SSE', () => {
  it('entrega aceite, passos, texto e conclusão em ordem e grava o turno', async () => {
    const step = makeStep({ id: 'passo-ti05' });
    app.agent.enqueue([
      { type: 'step', step },
      { type: 'text-delta', delta: 'Você tem ' },
      { type: 'text-delta', delta: '1 chamado.' },
      {
        type: 'completed',
        text: 'Você tem 1 chamado.',
        steps: [step],
        decision: makeDecision(),
        runId: 'run-ti05',
      },
    ]);
    const events = await bruno.send('Qual o status do meu chamado?');
    expect(events.map((event) => event.event)).toEqual([
      'message.accepted',
      'turn.step',
      'turn.text-delta',
      'turn.text-delta',
      'turn.completed',
    ]);
    const { message } = events.at(-1)!.data as { message: { id: string } };
    const view = await bruno.json<EmployeeConversationView>('GET', '/conversations/current');
    const saved = view.body.timeline.find((entry) => entry.id === message.id);
    expect(saved?.text).toBe('Você tem 1 chamado.');
    expect(saved?.turn?.steps).toEqual([step]);
    expect(view.body.usage.messagesUsed).toBe(1);
  });

  it('responde turn.failed retryable e refaz o turno sem contar outra mensagem', async () => {
    const carla = chatClient(app, await app.sessionCookie(DEMO_EMPLOYEES[2]!.id));
    app.agent.enqueue([{ type: 'failed', code: 'agent_unavailable', retryable: true }]);
    const failed = await carla.send('Preciso de ajuda com a VPN');
    expect(failed.map((event) => event.event)).toEqual(['message.accepted', 'turn.failed']);
    expect(failed[1]?.data).toMatchObject({ retryable: true });
    app.agent.enqueue([completedEvent('Agora deu certo.')]);
    const retried = await carla.stream('/conversations/current/turns/retry', { body: {} });
    expect(retried.map((event) => event.event)).toEqual(['turn.completed']);
    const view = await carla.json<EmployeeConversationView>('GET', '/conversations/current');
    expect(view.body.usage.messagesUsed).toBe(1);
  });

  it('responde 404 ao refazer quando não há turno com falha', async () => {
    const { status, body } = await ana.json('POST', '/conversations/current/turns/retry', {});
    expect(status).toBe(404);
    expect(errorCode(body)).toBe('not_found');
  });
});

describe('TI-15: limites sem chamar o modelo', () => {
  it('recusa a 31ª mensagem da sessão com message_limit_reached', async () => {
    const diego = chatClient(app, await app.sessionCookie(DEMO_EMPLOYEES[3]!.id));
    for (let sent = 0; sent < SESSION_MESSAGE_LIMIT; sent += 1) {
      app.agent.enqueue([completedEvent(`Resposta ${sent}`)]);
      await diego.send(`mensagem ${sent}`);
    }
    const calls = app.agent.inputs.length;
    const refused = await diego.json('POST', MESSAGES, { text: 'mais uma' });
    expect(refused.status).toBe(TOO_MANY_REQUESTS);
    expect(errorCode(refused.body)).toBe('message_limit_reached');
    expect(app.agent.inputs).toHaveLength(calls);
  });
});

describe('TI-15: excesso por minuto', () => {
  it('recusa o excesso com rate_limited, por usuário, e sem chamar o modelo', async () => {
    const limited = await startChatTestApp({ rateLimitPerMinute: 2 });
    const first = chatClient(limited, await limited.sessionCookie(ANA.id));
    const second = chatClient(limited, await limited.sessionCookie(BRUNO.id));
    for (const text of ['um', 'dois']) {
      limited.agent.enqueue([completedEvent(`ok ${text}`)]);
      await first.send(text);
    }
    const refused = await first.json('POST', MESSAGES, { text: 'três' });
    limited.agent.enqueue([completedEvent('ok outro usuário')]);
    const otherUser = await second.send('olá');
    expect(refused.status).toBe(TOO_MANY_REQUESTS);
    expect(errorCode(refused.body)).toBe('rate_limited');
    expect(limited.agent.inputs).toHaveLength(3);
    expect(otherUser.map((event) => event.event)).toContain('turn.completed');
    await limited.close();
  });
});
