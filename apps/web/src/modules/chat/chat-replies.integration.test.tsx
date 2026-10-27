import type { ChatMessage, SendMessageRequest } from '@nexo/contracts';
import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { completedStream } from '@/test/chat-api-mock';
import { makeTicketDetail } from '@/test/chat-cards-factories';
import { makeChatMessage, makeConversation, makeConversationView } from '@/test/chat-factories';
import { makeTicketSummary } from '@/test/console-fixtures';
import {
  accepted,
  COMPOSER_NAME,
  completedReply,
  openChat,
  recordPost,
  thread,
} from './chat-test-setup.js';

const OPTIONS_MESSAGE = makeChatMessage({
  author: 'agent',
  text: 'Quem está sendo afetado?',
  parts: [
    {
      type: 'quick_options',
      question: 'Quem está sendo afetado?',
      options: [
        { id: 'only_me', label: 'Só eu' },
        { id: 'my_team', label: 'Minha equipe' },
      ],
      answered: false,
    },
  ],
});

function optionsView() {
  return makeConversationView({
    conversation: makeConversation(),
    timeline: [OPTIONS_MESSAGE],
  });
}

function replyStream(text: string) {
  return () => completedStream([accepted(text), completedReply('Entendido.')]);
}

describe('opções rápidas (TI-22)', () => {
  it('responde pelo clique enviando quickReply com o rótulo da opção', async () => {
    const log = recordPost<SendMessageRequest>('/messages', replyStream('Só eu'));
    const { app } = openChat(optionsView());
    await app.user.click(await screen.findByRole('button', { name: 'Só eu' }));
    await waitFor(() => expect(log.bodies).toHaveLength(1));
    expect(log.bodies[0]).toMatchObject({
      text: 'Só eu',
      quickReply: { messageId: OPTIONS_MESSAGE.id, optionId: 'only_me' },
    });
    expect(await thread().findByText('Entendido.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Só eu' })).toBeDisabled();
  });

  it('responde pela tecla numérica', async () => {
    const log = recordPost<SendMessageRequest>('/messages', replyStream('Minha equipe'));
    const { app } = openChat(optionsView());
    await screen.findByRole('button', { name: 'Só eu' });
    await app.user.keyboard('2');
    await waitFor(() => expect(log.bodies).toHaveLength(1));
    expect(log.bodies[0]?.quickReply).toEqual({
      messageId: OPTIONS_MESSAGE.id,
      optionId: 'my_team',
    });
  });

  it('não trata o dígito como opção quando o funcionário está digitando', async () => {
    const log = recordPost<SendMessageRequest>('/messages', replyStream('x'));
    const { app } = openChat(optionsView());
    await app.user.type(await screen.findByRole('textbox', { name: COMPOSER_NAME }), 'abc1');
    expect(log.bodies).toEqual([]);
    expect(screen.getByRole('textbox', { name: COMPOSER_NAME })).toHaveValue('abc1');
  });
});

function selectionMessage(): ChatMessage {
  const overdue = makeTicketSummary({ number: 'INC-20311', overdue: true, priority: 'medium' });
  const other = makeTicketSummary({ number: 'INC-20400', title: 'Impressora sem toner' });
  return makeChatMessage({
    author: 'agent',
    text: 'Qual chamado você quer consultar?',
    parts: [{ type: 'ticket_selection', tickets: [overdue, other], selectedNumber: null }],
  });
}

describe('seleção de chamado (TI-23)', () => {
  it('escolhe um chamado da lista e mostra o card com prazo vencido', async () => {
    const message = selectionMessage();
    const ticket = makeTicketDetail({ number: 'INC-20311', overdue: true });
    const reply = makeChatMessage({
      author: 'agent',
      text: 'O INC-20311 está acima do prazo.',
      parts: [{ type: 'ticket_card', ticket }],
    });
    const conversation = makeConversation();
    const usage = { messagesUsed: 1, messagesLimit: 30 };
    const completed = {
      event: 'turn.completed',
      data: { message: reply, conversation, usage },
    } as const;
    const log = recordPost<SendMessageRequest>('/messages', () =>
      completedStream([accepted('INC-20311'), completed]),
    );
    const view = makeConversationView({ conversation, timeline: [message] });
    const { app } = openChat(view);
    const choices = await screen.findByRole('list', { name: 'Escolha um chamado' });
    expect(choices).toHaveTextContent('Impressora sem toner');
    await app.user.click(screen.getByRole('button', { name: /INC-20311/ }));
    expect(await thread().findByText('O INC-20311 está acima do prazo.')).toBeVisible();
    expect(log.bodies[0]?.ticketSelection).toEqual({ messageId: message.id, number: 'INC-20311' });
    expect(screen.queryByRole('list', { name: 'Escolha um chamado' })).not.toBeInTheDocument();
    expect(screen.getAllByText('· prazo vencido').length).toBeGreaterThan(0);
  });
});
