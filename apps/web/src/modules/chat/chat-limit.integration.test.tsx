import { screen, waitFor, within } from '@testing-library/react';
import { HttpResponse, http as mswHttp } from 'msw';
import { describe, expect, it } from 'vitest';
import { completedStream } from '@/test/chat-api-mock';
import {
  makeChatMessage,
  makeConversation,
  makeConversationView,
  makeDecision,
} from '@/test/chat-factories';
import { renderWithProviders } from '@/test/render';
import { apiUrl, server } from '@/test/server';
import { ChatPage } from './pages/chat-page.js';

const CURRENT = apiUrl('/conversations/current');
const COMPOSER_NAME = 'Mensagem para o Nexo';

function limitedView(messagesUsed: number) {
  return makeConversationView({
    conversation: makeConversation(),
    usage: { messagesUsed, messagesLimit: 30 },
  });
}

describe('limite de mensagens da sessão (TI-25)', () => {
  it('desabilita o campo em 30/30 e transfere para um analista pelo botão', async () => {
    let handoffRequests = 0;
    server.use(
      mswHttp.get(CURRENT, () => HttpResponse.json(limitedView(30))),
      mswHttp.post(`${CURRENT}/handoff`, () => {
        handoffRequests += 1;
        return HttpResponse.json(makeConversation({ state: 'waiting_analyst' }));
      }),
    );
    const app = renderWithProviders(<ChatPage />);
    expect(await screen.findByRole('textbox', { name: COMPOSER_NAME })).toBeDisabled();
    expect(screen.getByText('30/30 mensagens nesta sessão')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeDisabled();
    await app.user.click(screen.getByRole('button', { name: 'Falar com um analista' }));
    await waitFor(() => expect(handoffRequests).toBe(1));
  });

  it('responde a 30ª mensagem e depois desabilita o campo', async () => {
    const message = makeChatMessage({ text: 'Última pergunta' });
    const agent = makeChatMessage({
      author: 'agent',
      text: 'Resposta final',
      turn: { steps: [], decision: makeDecision() },
    });
    const usage = { messagesUsed: 30, messagesLimit: 30 };
    const events = [
      { event: 'message.accepted', data: { message, usage } },
      {
        event: 'turn.completed',
        data: { message: agent, conversation: makeConversation(), usage },
      },
    ] as const;
    server.use(
      mswHttp.get(CURRENT, () => HttpResponse.json(limitedView(29))),
      mswHttp.post(`${CURRENT}/messages`, () => completedStream([...events])),
    );
    const app = renderWithProviders(<ChatPage />);
    const input = await screen.findByRole('textbox', { name: COMPOSER_NAME });
    expect(screen.queryByRole('button', { name: 'Falar com um analista' })).not.toBeInTheDocument();
    await app.user.type(input, 'Última pergunta');
    await app.user.click(screen.getByRole('button', { name: 'Enviar' }));
    const thread = await screen.findByRole('list', { name: 'Mensagens' });
    expect(await within(thread).findByText('Resposta final')).toBeVisible();
    expect(screen.getByRole('textbox', { name: COMPOSER_NAME })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Falar com um analista' })).toBeVisible();
  });
});
