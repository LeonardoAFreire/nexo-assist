import type {
  ChatTurnOutcome,
  ConfirmPendingActionRequest,
  EditPendingActionRequest,
  EmployeeConversationView,
  PendingAction,
} from '@nexo/contracts';
import { screen, waitFor, within } from '@testing-library/react';
import { HttpResponse, http as mswHttp } from 'msw';
import { describe, expect, it } from 'vitest';
import { makePendingAction, makeTicketDetail, makeDraft } from '@/test/chat-cards-factories';
import { makeChatMessage, makeConversation, makeConversationView } from '@/test/chat-factories';
import { apiUrl, server } from '@/test/server';
import { CURRENT, openChat, thread } from './chat-test-setup.js';

const ACTION = makePendingAction();
const ACTION_PATH = `${CURRENT}/pending-actions/${ACTION.id}`;

function draftView(action: PendingAction = ACTION): EmployeeConversationView {
  const agent = makeChatMessage({
    author: 'agent',
    text: 'Confira antes de eu criar:',
    parts: [{ type: 'pending_action', action }],
  });
  const conversation = makeConversation({ pendingAction: action });
  return makeConversationView({ conversation, timeline: [agent] });
}

function confirmedOutcome(): ChatTurnOutcome {
  const ticket = makeTicketDetail();
  const message = makeChatMessage({
    author: 'agent',
    text: 'Pronto: abri o chamado com prioridade alta.',
    parts: [{ type: 'ticket_card', ticket }],
  });
  return { message, conversation: makeConversation({ pendingAction: null }) };
}

function serveConfirm(): ConfirmPendingActionRequest[] {
  const bodies: ConfirmPendingActionRequest[] = [];
  server.use(
    mswHttp.post(apiUrl(`${ACTION_PATH}/confirm`), async ({ request }) => {
      bodies.push((await request.json()) as ConfirmPendingActionRequest);
      return HttpResponse.json(confirmedOutcome());
    }),
  );
  return bodies;
}

describe('rascunho de chamado (TI-21)', () => {
  it('mostra número, estado, prioridade com prazo e afetados', async () => {
    openChat(draftView());
    const card = await screen.findByRole('article', { name: 'Rascunho D-381' });
    expect(card).toHaveTextContent('Aguardando confirmação');
    expect(within(card).getByText('Alta')).toBeVisible();
    expect(card).toHaveTextContent('resposta até');
    expect(within(card).getByText('Afetados')).toBeVisible();
    expect(within(card).getByText('Só eu')).toBeVisible();
  });

  it('confirma o rascunho pelo clique e mostra o chamado criado', async () => {
    const bodies = serveConfirm();
    const { app } = openChat(draftView());
    await app.user.click(await screen.findByRole('button', { name: 'Confirmar' }));
    expect(await thread().findByText('Pronto: abri o chamado com prioridade alta.')).toBeVisible();
    expect(bodies).toEqual([{ via: 'button' }]);
    expect(thread().getByText('INC-20519')).toBeVisible();
    expect(thread().getByText('Rascunho D-381 · confirmada · INC-20519')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Confirmar' })).not.toBeInTheDocument();
  });

  it('confirma o rascunho com Ctrl+Enter', async () => {
    const bodies = serveConfirm();
    const { app } = openChat(draftView());
    await screen.findByRole('button', { name: 'Confirmar' });
    await app.user.keyboard('{Control>}{Enter}{/Control}');
    await waitFor(() => expect(bodies).toEqual([{ via: 'shortcut' }]));
    expect(await thread().findByText('Rascunho D-381 · confirmada · INC-20519')).toBeVisible();
  });

  it('cancela o rascunho sem criar chamado', async () => {
    server.use(
      mswHttp.post(apiUrl(`${ACTION_PATH}/cancel`), () =>
        HttpResponse.json(makePendingAction({ status: 'cancelled' })),
      ),
    );
    const { app } = openChat(draftView());
    await app.user.click(await screen.findByRole('button', { name: 'Cancelar' }));
    expect(await thread().findByText('Rascunho D-381 · cancelada')).toBeVisible();
  });

  it('edita título e afetados e mostra a prioridade recalculada', async () => {
    const bodies: EditPendingActionRequest[] = [];
    const draft = makeDraft({ title: 'Título novo do chamado', priority: 'critical' });
    server.use(
      mswHttp.patch(apiUrl(ACTION_PATH), async ({ request }) => {
        bodies.push((await request.json()) as EditPendingActionRequest);
        return HttpResponse.json(makePendingAction({ draft }));
      }),
    );
    const { app } = openChat(draftView());
    await app.user.click(await screen.findByRole('button', { name: 'Editar' }));
    const title = screen.getByRole('textbox', { name: 'Título' });
    await app.user.clear(title);
    await app.user.type(title, 'Título novo do chamado');
    await app.user.selectOptions(screen.getByLabelText('Afetados'), 'whole_company');
    await app.user.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByRole('heading', { name: 'Título novo do chamado' })).toBeVisible();
    expect(bodies).toEqual([{ title: 'Título novo do chamado', affected: 'whole_company' }]);
    expect(screen.getByText('Crítica')).toBeVisible();
  });

  it('não envia a edição quando o título é curto demais', async () => {
    const bodies: unknown[] = [];
    server.use(
      mswHttp.patch(apiUrl(ACTION_PATH), async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json(ACTION);
      }),
    );
    const { app } = openChat(draftView());
    await app.user.click(await screen.findByRole('button', { name: 'Editar' }));
    const title = screen.getByRole('textbox', { name: 'Título' });
    await app.user.clear(title);
    await app.user.type(title, 'abc');
    await app.user.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByText('O título deve ter de 5 a 120 caracteres.')).toBeVisible();
    expect(bodies).toEqual([]);
  });

  it('mostra o erro do servidor quando o rascunho já foi resolvido', async () => {
    const error = { code: 'pending_action_not_pending', message: 'Esta ação já foi resolvida.' };
    server.use(
      mswHttp.post(apiUrl(`${ACTION_PATH}/confirm`), () =>
        HttpResponse.json({ error }, { status: 409 }),
      ),
    );
    const { app } = openChat(draftView());
    await app.user.click(await screen.findByRole('button', { name: 'Confirmar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Esta ação já foi resolvida.');
  });
});
