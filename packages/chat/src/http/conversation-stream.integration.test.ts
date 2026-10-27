import {
  CHAT_CONVERSATION_HANDED_OFF,
  type ChatMessage,
  type Conversation,
  DEMO_ANALYSTS,
  DEMO_EMPLOYEES,
  type EmployeeConversationView,
} from '@nexo/contracts';
import { finalize } from 'rxjs';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { completedEvent } from '../core/testing/agent-events.js';
import { ConversationEventsHub } from '../core/events/conversation-events-hub.js';
import { chatClient, type ChatHttpClient } from './testing/chat-http-client.js';
import { type ChatTestApp, startChatTestApp } from './testing/chat-test-app.js';
import { openSse, type SseSubscription } from './testing/sse-subscription.js';

const [ANA, BRUNO, CARLA, DIEGO, ELISA] = DEMO_EMPLOYEES;
const RAFAEL = DEMO_ANALYSTS[0]!;
const HANDOFF = '/conversations/current/handoff';
const EVENTS = '/conversations/current/events';
const REQUESTED = { reason: 'requested' };
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

let app: ChatTestApp;
const subscriptions: SseSubscription[] = [];

beforeAll(async () => {
  app = await startChatTestApp();
});

afterEach(() => {
  subscriptions.splice(0).forEach((subscription) => subscription.close());
});

afterAll(async () => {
  await app.close();
});

async function clientFor(person: { id: string } | undefined): Promise<ChatHttpClient> {
  return chatClient(app, await app.sessionCookie(person!.id));
}

async function subscribe(person: { id: string } | undefined): Promise<SseSubscription> {
  const cookie = await app.sessionCookie(person!.id);
  const subscription = await openSse(`${app.baseUrl}${EVENTS}`, { cookie });
  subscriptions.push(subscription);
  return subscription;
}

async function talk(client: ChatHttpClient, reply: string): Promise<void> {
  app.agent.enqueue([completedEvent(reply)]);
  await client.send('Preciso de ajuda com o meu chamado');
}

describe('POST /api/conversations/current/handoff', () => {
  it('TI-09: transfere a pedido, monta o resumo no código e publica o evento', async () => {
    const ana = await clientFor(ANA);
    await talk(ana, 'O INC-20311 está em andamento.');
    const agentCalls = app.agent.inputs.length;
    const { status, body } = await ana.json<Conversation>('POST', HANDOFF, REQUESTED);
    expect(status).toBe(200);
    expect(body.state).toBe('waiting_analyst');
    expect(body.handoff).toMatchObject({ reason: 'requested', level: 'N1' });
    expect(body.handoff?.ticketNumbers).toEqual(['INC-20311']);
    expect(body.handoff?.summary).toContain('Último pedido: "Preciso de ajuda com o meu chamado"');
    const { handedOffAt, contactDueAt } = body.handoff!;
    expect(Date.parse(contactDueAt) - Date.parse(handedOffAt)).toBe(TWO_HOURS_MS);
    expect(app.agent.inputs).toHaveLength(agentCalls);
    expect(app.events.published).toHaveLength(1);
    expect(app.events.published[0]).toMatchObject({
      name: CHAT_CONVERSATION_HANDED_OFF,
      payload: { conversationId: body.id, requesterId: ANA!.id, reason: 'requested', level: 'N1' },
    });
    const view = await ana.json<EmployeeConversationView>('GET', '/conversations/current');
    const labels = view.body.timeline.filter((m) => m.author === 'system').map((m) => m.text);
    expect(labels.at(-1)).toMatch(/^Transferida para o suporte N1 · contato até /);
  });

  it('recusa transferir de novo (409) e sem conversa ativa (404)', async () => {
    const ana = await clientFor(ANA);
    const again = await ana.json<{ error: { code: string } }>('POST', HANDOFF, REQUESTED);
    const bruno = await clientFor(BRUNO);
    const none = await bruno.json<{ error: { code: string } }>('POST', HANDOFF, REQUESTED);
    expect([again.status, again.body.error.code]).toEqual([409, 'invalid_conversation_state']);
    expect([none.status, none.body.error.code]).toEqual([404, 'not_found']);
    expect(app.events.published).toHaveLength(1);
  });

  it('valida o corpo, a origem e o papel da sessão', async () => {
    const bruno = await clientFor(BRUNO);
    const analyst = await clientFor(RAFAEL);
    const wrongReason = await bruno.call('POST', HANDOFF, { body: { reason: 'critical' } });
    const extra = await bruno.call('POST', HANDOFF, { body: { ...REQUESTED, userId: ANA!.id } });
    const foreign = await bruno.call('POST', HANDOFF, { body: REQUESTED, origin: null });
    const forbidden = await analyst.call('POST', HANDOFF, { body: REQUESTED });
    const statuses = [wrongReason, extra, foreign, forbidden].map((response) => response.status);
    expect(statuses).toEqual([400, 400, 403, 403]);
  });

  it('TI-10: não chama o agent e entrega ao console a mensagem enviada na transferência', async () => {
    const carla = await clientFor(CARLA);
    await talk(carla, 'Vou verificar.');
    const transferred = await carla.json<Conversation>('POST', HANDOFF, REQUESTED);
    const agentCalls = app.agent.inputs.length;
    const events = await carla.send('Alguém pode me atender?');
    expect(events.map((event) => event.event)).toEqual(['message.accepted', 'turn.skipped']);
    expect(events[1]?.data).toEqual({ reason: 'waiting_analyst' });
    expect(app.agent.inputs).toHaveLength(agentCalls);
    const analyst = await clientFor(RAFAEL);
    const path = `/console/conversations/${transferred.body.id}`;
    const detail = await analyst.json<{ timeline: ChatMessage[] }>('GET', path);
    const texts = detail.body.timeline.map((message) => message.text);
    expect(texts).toContain('Alguém pode me atender?');
    await analyst.json('POST', `${path}/claim`);
    const claimed = await carla.send('Obrigada!');
    expect(claimed[1]?.data).toEqual({ reason: 'with_analyst' });
    expect(app.agent.inputs).toHaveLength(agentCalls);
  });
});

describe('GET /api/conversations/current/events', () => {
  it('entrega ao funcionário só os eventos da conversa dele', async () => {
    const diego = await clientFor(DIEGO);
    const elisa = await clientFor(ELISA);
    const watching = await subscribe(DIEGO);
    await talk(elisa, 'Resposta para Elisa.');
    await talk(diego, 'Resposta para Diego.');
    const own = await watching.waitFor((event) => event.event === 'message.created');
    await watching.waitFor((event) => JSON.stringify(event.data).includes('Resposta para Diego.'));
    const ownConversation = (
      await diego.json<EmployeeConversationView>('GET', '/conversations/current')
    ).body.conversation!;
    const ids = watching.events.flatMap(
      (event) => JSON.stringify(event.data).match(/"conversationId":"[^"]+"/g) ?? [],
    );
    expect(watching.status).toBe(200);
    expect(own.data).toHaveProperty('message');
    expect(new Set(ids)).toEqual(new Set([`"conversationId":"${ownConversation.id}"`]));
    expect(JSON.stringify(watching.events)).not.toContain('Resposta para Elisa.');
  });

  it('publica conversation.updated na transferência', async () => {
    const watching = await subscribe(ANA);
    const analyst = await clientFor(RAFAEL);
    const ana = await clientFor(ANA);
    const current = await ana.json<EmployeeConversationView>('GET', '/conversations/current');
    await analyst.json('POST', `/console/conversations/${current.body.conversation!.id}/claim`);
    const updated = await watching.waitFor((event) => event.event === 'conversation.updated');
    expect(updated.data).toMatchObject({ conversation: { state: 'with_analyst' } });
  });

  it('exige sessão de funcionário', async () => {
    const analyst = await app.sessionCookie(RAFAEL.id);
    const anonymous = await fetch(`${app.baseUrl}${EVENTS}`);
    const forbidden = await fetch(`${app.baseUrl}${EVENTS}`, { headers: { cookie: analyst } });
    expect([anonymous.status, forbidden.status]).toEqual([401, 403]);
  });

  it('cancela a inscrição no hub quando a conexão fecha', async () => {
    const hub = app.resolve(ConversationEventsHub);
    const original = hub.forEmployee.bind(hub);
    const closed = vi.fn();
    vi.spyOn(hub, 'forEmployee').mockImplementation((id) => original(id).pipe(finalize(closed)));
    const watching = await subscribe(BRUNO);
    expect(closed).not.toHaveBeenCalled();
    watching.close();
    await vi.waitFor(() => expect(closed).toHaveBeenCalledTimes(1));
    vi.restoreAllMocks();
  });
});
