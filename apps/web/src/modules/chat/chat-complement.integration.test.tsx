import type { ChatTurnOutcome, EmployeeConversationView, PendingAction } from '@nexo/contracts';
import { screen } from '@testing-library/react';
import { HttpResponse, http as mswHttp } from 'msw';
import { describe, expect, it } from 'vitest';
import { makePendingAction, makeTicketDetail } from '@/test/chat-cards-factories';
import { makeChatMessage, makeConversation, makeConversationView } from '@/test/chat-factories';
import { apiUrl, server } from '@/test/server';
import { CURRENT, openChat, thread } from './chat-test-setup.js';

function viewWith(action: PendingAction): EmployeeConversationView {
  const agent = makeChatMessage({
    author: 'agent',
    text: 'Confira antes de eu atualizar:',
    parts: [{ type: 'pending_action', action }],
  });
  const conversation = makeConversation({ pendingAction: action });
  return makeConversationView({ conversation, timeline: [agent] });
}

function outcomeFor(text: string): ChatTurnOutcome {
  const ticket = makeTicketDetail({ number: 'INC-20311' });
  const parts = [{ type: 'ticket_card', ticket }] as const;
  const message = makeChatMessage({ author: 'agent', text, parts: [...parts] });
  return { message, conversation: makeConversation({ pendingAction: null }) };
}

describe('cards de complemento e reabertura (TI-21)', () => {
  it('confirma o complemento sem oferecer edição', async () => {
    const action = makePendingAction({
      kind: 'complement_ticket',
      displayNumber: 'D-382',
      draft: null,
      targetNumber: 'INC-20311',
      complement: 'O problema piorou hoje de manhã.',
    });
    server.use(
      mswHttp.post(apiUrl(`${CURRENT}/pending-actions/${action.id}/confirm`), () =>
        HttpResponse.json(outcomeFor('Pronto: acrescentei sua informação ao chamado.')),
      ),
    );
    const { app } = openChat(viewWith(action));
    expect(await screen.findByText('Complemento para INC-20311')).toBeVisible();
    expect(screen.getByText('O problema piorou hoje de manhã.')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
    await app.user.click(screen.getByRole('button', { name: 'Confirmar' }));
    expect(
      await thread().findByText('Pronto: acrescentei sua informação ao chamado.'),
    ).toBeVisible();
  });

  it('cancela a reabertura mostrando o motivo antes', async () => {
    const action = makePendingAction({
      kind: 'reopen_ticket',
      displayNumber: 'D-383',
      draft: null,
      targetNumber: 'INC-20290',
      complement: 'O erro voltou.',
    });
    server.use(
      mswHttp.post(apiUrl(`${CURRENT}/pending-actions/${action.id}/cancel`), () =>
        HttpResponse.json({ ...action, status: 'cancelled' }),
      ),
    );
    const { app } = openChat(viewWith(action));
    expect(await screen.findByText('Reabrir INC-20290')).toBeVisible();
    expect(screen.getByText('Motivo: O erro voltou.')).toBeVisible();
    await app.user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(await thread().findByText('Reabertura de chamado D-383 · cancelada')).toBeVisible();
  });
});
