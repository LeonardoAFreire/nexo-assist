import type { EmployeeConversationView } from '@nexo/contracts';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { makePendingAction } from '@/test/chat-cards-factories';
import { makeChatMessage, makeConversation, makeConversationView } from '@/test/chat-factories';
import { openChat } from './chat-test-setup.js';

function draftView(): EmployeeConversationView {
  const action = makePendingAction();
  const agent = makeChatMessage({
    author: 'agent',
    text: 'Confira antes de eu criar:',
    parts: [{ type: 'pending_action', action }],
  });
  const conversation = makeConversation({ pendingAction: action });
  return makeConversationView({ conversation, timeline: [agent] });
}

describe('edição do rascunho pelo teclado', () => {
  it('leva o foco para o primeiro campo ao abrir a edição', async () => {
    const { app } = openChat(draftView());
    await app.user.click(await screen.findByRole('button', { name: 'Editar' }));
    expect(screen.getByRole('textbox', { name: 'Título' })).toHaveFocus();
  });

  it('fecha a edição com Esc e devolve o foco ao botão Editar', async () => {
    const { app } = openChat(draftView());
    await app.user.click(await screen.findByRole('button', { name: 'Editar' }));
    await app.user.keyboard('{Escape}');
    expect(screen.queryByRole('form', { name: /Editar/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Editar' })).toHaveFocus();
  });
});
