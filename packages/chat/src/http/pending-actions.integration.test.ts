import {
  type ChatMessage,
  type ChatTurnOutcome,
  chatTurnOutcomeSchema,
  DEMO_EMPLOYEES,
  type EmployeeConversationView,
  type PendingAction,
  pendingActionSchema,
  TicketsUnavailableError,
} from '@nexo/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { completedEvent, makeDecision, makeStep } from '../core/testing/agent-events.js';
import { makeDraft } from '../core/testing/factories.js';
import { chatClient, type ChatHttpClient } from './testing/chat-http-client.js';
import { type ChatTestApp, startChatTestApp } from './testing/chat-test-app.js';

const [ANA, BRUNO, CARLA, DIEGO] = DEMO_EMPLOYEES;
const ACTIONS = '/conversations/current/pending-actions';
const BLOCKING_FACTS = {
  impact: 'only_me',
  blocksWork: true,
  sameDayCommitment: false,
  hasWorkaround: false,
  kind: 'incident',
} as const;

let app: ChatTestApp;

beforeAll(async () => {
  app = await startChatTestApp();
});

afterAll(async () => {
  await app.close();
});

async function clientFor(person: { id: string } | undefined): Promise<ChatHttpClient> {
  return chatClient(app, await app.sessionCookie(person!.id));
}

async function proposeDraft(
  client: ChatHttpClient,
  text = 'Minha VPN caiu',
): Promise<PendingAction> {
  app.agent.enqueue([
    {
      type: 'proposal',
      kind: 'create_ticket',
      draft: makeDraft({ priorityFacts: BLOCKING_FACTS, affected: 'only_me' }),
      targetNumber: null,
      complement: null,
    },
    completedEvent('Posso abrir este chamado?'),
  ]);
  const events = await client.send(text);
  const part = events.find((event) => event.event === 'turn.part')!;
  return (part.data as { part: { action: PendingAction } }).part.action;
}

function messageOf(events: { event: string; data: Record<string, unknown> }[]): ChatMessage {
  return (events.at(-1)!.data as { message: ChatMessage }).message;
}

describe('TI-06: confirmação cria o chamado', () => {
  it.each(['button', 'shortcut'] as const)(
    'cria com os seis campos e número definitivo (%s)',
    async (via) => {
      const ana = await clientFor(ANA);
      const action = await proposeDraft(ana);
      const { status, body } = await ana.json<ChatTurnOutcome>(
        'POST',
        `${ACTIONS}/${action.id}/confirm`,
        { via },
      );
      expect(status).toBe(200);
      const outcome = chatTurnOutcomeSchema.parse(body);
      const card = outcome.message.parts.find((part) => part.type === 'ticket_card');
      expect(card?.type === 'ticket_card' && card.ticket).toMatchObject({
        number: expect.stringMatching(/^INC-205\d\d$/),
        title: 'VPN não conecta no notebook',
        description: expect.stringContaining('notebook não conecta na VPN'),
        type: 'incident',
        category: 'network_vpn',
        priority: 'high',
        affected: 'only_me',
      });
      expect(outcome.conversation.pendingAction).toBeNull();
      expect(app.tickets.writes.at(-1)).toMatchObject({
        requesterId: ANA!.id,
        idempotencyKey: action.id,
      });
    },
  );

  it('não duplica ao confirmar de novo e responde pending_action_not_pending', async () => {
    const bruno = await clientFor(BRUNO);
    const action = await proposeDraft(bruno);
    const first = await bruno.json('POST', `${ACTIONS}/${action.id}/confirm`, { via: 'button' });
    const created = app.tickets.created.size;
    const second = await bruno.json<{ error: { code: string } }>(
      'POST',
      `${ACTIONS}/${action.id}/confirm`,
      { via: 'button' },
    );
    expect([first.status, second.status]).toEqual([200, 409]);
    expect(second.body.error.code).toBe('pending_action_not_pending');
    expect(app.tickets.created.size).toBe(created);
  });

  it('recusa corpo inválido e confirmação de ação de outro usuário com 404 indistinguível', async () => {
    const carla = await clientFor(CARLA);
    const diego = await clientFor(DIEGO);
    const action = await proposeDraft(carla);
    app.agent.enqueue([completedEvent('Oi, Diego.')]);
    await diego.send('olá');
    const invalid = await carla.json('POST', `${ACTIONS}/${action.id}/confirm`, { via: 'voice' });
    const foreign = await diego.json('POST', `${ACTIONS}/${action.id}/confirm`, { via: 'button' });
    const missing = await diego.json('POST', `${ACTIONS}/${crypto.randomUUID()}/confirm`, {
      via: 'button',
    });
    expect(invalid.status).toBe(400);
    expect([foreign.status, missing.status]).toEqual([404, 404]);
    expect(foreign.body).toEqual(missing.body);
    const stillPending = await carla.json<EmployeeConversationView>(
      'GET',
      '/conversations/current',
    );
    expect(stillPending.body.conversation?.pendingAction?.id).toBe(action.id);
  });
});

describe('TI-07: confirmação por texto', () => {
  it('confirma por frase afirmativa sem chamar o modelo', async () => {
    const ana = await clientFor(ANA);
    const action = await proposeDraft(ana);
    const calls = app.agent.inputs.length;
    const created = app.tickets.created.size;
    const events = await ana.send('sim, pode abrir');
    expect(events.map((event) => event.event)).toEqual([
      'message.accepted',
      'turn.started',
      'turn.step',
      'turn.completed',
    ]);
    expect(app.agent.inputs).toHaveLength(calls);
    expect(app.tickets.created.size).toBe(created + 1);
    expect(messageOf(events).parts[0]).toMatchObject({ type: 'ticket_card' });
    expect(app.tickets.writes.at(-1)?.idempotencyKey).toBe(action.id);
  });

  it('não grava com outra resposta nem com cancelamento', async () => {
    const bruno = await clientFor(BRUNO);
    const action = await proposeDraft(bruno);
    const created = app.tickets.created.size;
    app.agent.enqueue([completedEvent('Entendi, é no Wi-Fi.')]);
    const other = await bruno.send('na verdade é no Wi-Fi');
    const cancel = await bruno.send('cancelar');
    expect(other.at(-1)?.event).toBe('turn.completed');
    expect(cancel.map((event) => event.event)).toEqual([
      'message.accepted',
      'turn.started',
      'turn.completed',
    ]);
    expect(app.tickets.created.size).toBe(created);
    const view = await bruno.json<EmployeeConversationView>('GET', '/conversations/current');
    expect(view.body.conversation?.pendingAction).toBeNull();
    const cancelled = view.body.timeline
      .flatMap((entry) => entry.parts)
      .find((part) => part.type === 'pending_action' && part.action.id === action.id);
    expect(cancelled?.type === 'pending_action' && cancelled.action).toMatchObject({
      id: action.id,
      status: 'cancelled',
    });
  });
});

describe('TI-08: editar o rascunho', () => {
  it('recalcula a prioridade e mantém a ação pending', async () => {
    const diego = await clientFor(DIEGO);
    const action = await proposeDraft(diego);
    const { status, body } = await diego.json<PendingAction>('PATCH', `${ACTIONS}/${action.id}`, {
      affected: 'my_team',
    });
    expect(status).toBe(200);
    const edited = pendingActionSchema.parse(body);
    expect(edited.status).toBe('pending');
    expect(edited.draft).toMatchObject({ affected: 'my_team', priority: 'critical' });
    expect(edited.draft?.priorityFacts.impact).toBe('my_team');
    expect(action.draft?.priority).toBe('high');
  });

  it('recusa edição vazia ou com campo estranho com 400', async () => {
    const ana = await clientFor(ANA);
    const action = await proposeDraft(ana);
    const empty = await ana.json('PATCH', `${ACTIONS}/${action.id}`, {});
    const extra = await ana.json('PATCH', `${ACTIONS}/${action.id}`, {
      title: 'Título válido',
      requesterId: BRUNO!.id,
    });
    expect([empty.status, extra.status]).toEqual([400, 400]);
  });
});

describe('cancelar pelo botão', () => {
  it('cancela sem chamar o tickets e registra mensagem de sistema na conversa', async () => {
    const carla = await clientFor(CARLA);
    const action = await proposeDraft(carla);
    const writes = app.tickets.writes.length;
    const { status, body } = await carla.json<PendingAction>(
      'POST',
      `${ACTIONS}/${action.id}/cancel`,
    );
    expect(status).toBe(200);
    expect(pendingActionSchema.parse(body).status).toBe('cancelled');
    expect(app.tickets.writes).toHaveLength(writes);
    const view = await carla.json<EmployeeConversationView>('GET', '/conversations/current');
    expect(view.body.conversation?.pendingAction).toBeNull();
    expect(view.body.timeline.at(-1)).toMatchObject({
      author: 'system',
      text: 'Você cancelou a abertura do chamado.',
    });
    const again = await carla.json('POST', `${ACTIONS}/${action.id}/cancel`);
    expect(again.status).toBe(409);
  });
});

describe('TI-16: indisponibilidade do legado', () => {
  it('conclui após falha curta com mais de uma tentativa', async () => {
    const ana = await clientFor(ANA);
    const action = await proposeDraft(ana);
    app.tickets.failures.push(new TicketsUnavailableError());
    const { status, body } = await ana.json<ChatTurnOutcome>(
      'POST',
      `${ACTIONS}/${action.id}/confirm`,
      { via: 'button' },
    );
    expect(status).toBe(200);
    expect(body.message.turn?.steps[0]?.attempts).toBeGreaterThan(1);
  });

  it('responde 503 mantendo a ação pending e conclui quando o legado volta', async () => {
    const bruno = await clientFor(BRUNO);
    const action = await proposeDraft(bruno);
    app.tickets.failures.push(...Array.from({ length: 3 }, () => new TicketsUnavailableError()));
    const down = await bruno.json<{ error: { code: string } }>(
      'POST',
      `${ACTIONS}/${action.id}/confirm`,
      { via: 'button' },
    );
    expect(down.status).toBe(503);
    expect(down.body.error.code).toBe('tickets_unavailable');
    const view = await bruno.json<EmployeeConversationView>('GET', '/conversations/current');
    expect(view.body.conversation?.pendingAction).toMatchObject({
      id: action.id,
      status: 'pending',
    });
    const back = await bruno.json('POST', `${ACTIONS}/${action.id}/confirm`, { via: 'button' });
    expect(back.status).toBe(200);
  });

  it('degrada o turno do agent com passo failed e opções quando o legado persiste fora', async () => {
    const carla = await clientFor(CARLA);
    const failedStep = makeStep({
      id: 'falha',
      status: 'failed',
      result: 'sistema de chamados fora do ar',
    });
    app.agent.enqueue([
      { type: 'step', step: failedStep },
      {
        type: 'part',
        part: {
          type: 'quick_options',
          question: 'Como posso ajudar?',
          options: [{ id: 'handoff', label: 'Falar com um analista' }],
          answered: false,
        },
      },
      {
        type: 'completed',
        text: 'Não consegui consultar seus chamados agora.',
        steps: [failedStep],
        decision: makeDecision(),
        runId: 'run-degradado',
      },
    ]);
    const events = await carla.send('Quais são meus chamados?');
    expect(events.map((event) => event.event)).toEqual([
      'message.accepted',
      'turn.started',
      'turn.step',
      'turn.part',
      'turn.completed',
    ]);
    expect(events[2]?.data).toMatchObject({ step: { status: 'failed' } });
    const saved = messageOf(events);
    expect(saved.turn?.steps[0]?.status).toBe('failed');
    expect(saved.parts[0]).toMatchObject({ type: 'quick_options' });
  });
});
