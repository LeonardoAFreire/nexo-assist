import type { ChatMessage, Conversation, HandoffInfo, UserProfile } from '@nexo/contracts';
import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { completedStream } from '@/test/chat-api-mock';
import { makeChatMessage, makeConversation, makeConversationView } from '@/test/chat-factories';
import { accepted, COMPOSER_NAME, openChat, recordPost, thread } from './chat-test-setup.js';

const HANDOFF: HandoffInfo = {
  reason: 'requested',
  level: 'N2',
  summary: 'Ana quer falar com um analista.',
  ticketNumbers: [],
  confidence: null,
  contactDueAt: '2026-10-27T15:05:00.000Z',
  handedOffAt: '2026-10-27T13:05:00.000Z',
};

const ANALYST: UserProfile = {
  id: '9a1b0000-0000-4000-8000-000000000009',
  name: 'Rafael Lima',
  role: 'analyst',
  department: 'TI',
  supportLevel: 'N2',
  initials: 'RL',
};

function transferred(overrides: Partial<Conversation> = {}): Conversation {
  return makeConversation({ state: 'waiting_analyst', handoff: HANDOFF, ...overrides });
}

function handedOffEvent(): ChatMessage {
  const part = {
    type: 'event',
    kind: 'handed_off',
    label: 'Transferida para Suporte N2',
    actorName: null,
  } as const;
  return makeChatMessage({ author: 'system', text: '', parts: [part] });
}

function analystMessage(text: string): ChatMessage {
  return makeChatMessage({ author: 'analyst', authorName: 'Rafael Lima', authorLevel: 'N2', text });
}

describe('conversa transferida (TI-26)', () => {
  it('mostra a faixa de espera, o evento de transferência e as mensagens do analista', async () => {
    const timeline = [handedOffEvent(), analystMessage('Oi Ana, já estou vendo o seu caso.')];
    openChat(makeConversationView({ conversation: transferred(), timeline }));
    expect(await screen.findByText('Aguardando atendente')).toBeVisible();
    expect(screen.getByText(/Suporte N2 · contato até/)).toBeVisible();
    expect(thread().getByText('Transferida para Suporte N2')).toBeVisible();
    const message = thread().getByRole('article', { name: 'Rafael Lima · Suporte N2' });
    expect(within(message).getByText('Oi Ana, já estou vendo o seu caso.')).toBeVisible();
  });

  it('atualiza a faixa e a conversa em tempo real quando o analista assume', async () => {
    const { events } = openChat(makeConversationView({ conversation: transferred() }));
    await screen.findByText('Aguardando atendente');
    await waitFor(() => expect(events.client).not.toBeNull());
    const claimed = transferred({ state: 'with_analyst', assignedAnalyst: ANALYST });
    events.emit({ event: 'conversation.updated', data: { conversation: claimed } });
    expect(await screen.findByText('Você está com um analista')).toBeVisible();
    expect(screen.queryByText('Aguardando atendente')).not.toBeInTheDocument();
    events.emit({
      event: 'message.created',
      data: { message: analystMessage('Assumi o seu atendimento.') },
    });
    expect(await thread().findByText('Assumi o seu atendimento.')).toBeVisible();
  });

  it('entrega a mensagem ao analista sem resposta do agent e mantém o campo ativo', async () => {
    const view = makeConversationView({ conversation: transferred() });
    const log = recordPost<{ text: string }>('/messages', () =>
      completedStream([
        accepted('Ainda estou aqui'),
        { event: 'turn.skipped', data: { reason: 'waiting_analyst' } },
      ]),
    );
    const { app } = openChat(view);
    const composer = await screen.findByRole('textbox', { name: COMPOSER_NAME });
    expect(composer).toHaveAttribute('placeholder', 'Escreva para o analista…');
    await app.user.type(composer, 'Ainda estou aqui');
    await app.user.click(screen.getByRole('button', { name: 'Enviar' }));
    await waitFor(() =>
      expect(log.bodies).toEqual([expect.objectContaining({ text: 'Ainda estou aqui' })]),
    );
    await waitFor(() => expect(composer).toBeEnabled());
    expect(screen.queryByText('Nexo Assist está digitando')).not.toBeInTheDocument();
  });

  it('mantém o histórico visível e remove a faixa quando o analista encerra', async () => {
    const timeline = [analystMessage('Resolvido por aqui.')];
    const conversation = transferred({ state: 'with_analyst', assignedAnalyst: ANALYST });
    const { events } = openChat(makeConversationView({ conversation, timeline }));
    await screen.findByText('Você está com um analista');
    await waitFor(() => expect(events.client).not.toBeNull());
    events.emit({
      event: 'conversation.updated',
      data: { conversation: { ...conversation, state: 'closed' } },
    });
    await waitFor(() =>
      expect(screen.queryByText('Você está com um analista')).not.toBeInTheDocument(),
    );
    expect(thread().getByText('Resolvido por aqui.')).toBeVisible();
    expect(screen.getByRole('textbox', { name: COMPOSER_NAME })).toBeEnabled();
  });
});
