import type { ChatMessage, ChatStreamEvent, EmployeeConversationView } from '@nexo/contracts';
import { screen, waitFor, within } from '@testing-library/react';
import { HttpResponse, http as mswHttp } from 'msw';
import { describe, expect, it } from 'vitest';
import { completedStream, controlledStream, currentConversationMock } from '@/test/chat-api-mock';
import {
  makeChatMessage,
  makeConversation,
  makeConversationView,
  makeDecision,
  makeStep,
} from '@/test/chat-factories';
import { renderWithProviders } from '@/test/render';
import { apiUrl, server } from '@/test/server';
import { ChatPage } from './pages/chat-page.js';

const CURRENT = '/conversations/current';
const FAILURE_MESSAGE = 'Não consegui responder agora. Tente de novo ou fale com um analista.';

function usage(messagesUsed: number): { messagesUsed: number; messagesLimit: number } {
  return { messagesUsed, messagesLimit: 30 };
}

function accepted(text: string, messagesUsed: number): ChatStreamEvent {
  const message = makeChatMessage({ text });
  return { event: 'message.accepted', data: { message, usage: usage(messagesUsed) } };
}

function completed(text: string, messagesUsed: number): ChatStreamEvent {
  const turn = { steps: [makeStep()], decision: makeDecision() };
  const message = makeChatMessage({ author: 'agent', text, turn });
  const data = { message, conversation: makeConversation(), usage: usage(messagesUsed) };
  return { event: 'turn.completed', data };
}

function failed(retryable: boolean): ChatStreamEvent {
  const error = { code: 'agent_unavailable', message: FAILURE_MESSAGE } as const;
  return { event: 'turn.failed', data: { error, retryable } };
}

function serveConversation(view: EmployeeConversationView): void {
  server.use(currentConversationMock(view));
}

function thread(): ReturnType<typeof within> {
  return within(screen.getByRole('list', { name: 'Mensagens' }));
}

function servePost(path: string, response: () => Response): void {
  server.use(mswHttp.post(apiUrl(`${CURRENT}${path}`), response));
}

async function sendText(app: ReturnType<typeof renderWithProviders>, text: string): Promise<void> {
  await app.user.type(await screen.findByRole('textbox', { name: 'Mensagem para o Nexo' }), text);
  await app.user.click(screen.getByRole('button', { name: 'Enviar' }));
}

describe('chat em streaming (TI-20)', () => {
  it('mostra o texto do agent aos poucos, com os passos acima da resposta', async () => {
    serveConversation(makeConversationView());
    const stream = controlledStream();
    servePost('/messages', () => stream.response);
    const app = renderWithProviders(<ChatPage />);
    await sendText(app, 'Qual o status do meu chamado?');
    stream.push(accepted('Qual o status do meu chamado?', 1));
    stream.push({ event: 'turn.step', data: { step: makeStep() } });
    expect(await screen.findByText('consultou seus chamados')).toBeVisible();
    expect(screen.getByText('Nexo Assist está digitando')).toBeInTheDocument();
    stream.push({ event: 'turn.text-delta', data: { delta: 'Você tem 3 ' } });
    expect(await screen.findByText('Você tem 3')).toBeVisible();
    stream.push({ event: 'turn.text-delta', data: { delta: 'chamados abertos.' } });
    expect(await screen.findByText('Você tem 3 chamados abertos.')).toBeVisible();
    stream.push(completed('Você tem 3 chamados abertos.', 1));
    stream.close();
    expect(await screen.findByRole('button', { name: 'Ver detalhes da decisão' })).toBeVisible();
    expect(thread().getByText('Você tem 3 chamados abertos.')).toBeVisible();
    expect(screen.queryByText('Nexo Assist está digitando')).not.toBeInTheDocument();
  });

  it('mostra o erro do turno e refaz o turno sem repetir a mensagem do funcionário', async () => {
    serveConversation(makeConversationView());
    servePost('/messages', () => completedStream([accepted('Oi', 1), failed(true)]));
    servePost('/turns/retry', () => completedStream([completed('Olá, Ana!', 1)]));
    const app = renderWithProviders(<ChatPage />);
    await sendText(app, 'Oi');
    expect(await screen.findByRole('alert')).toHaveTextContent(FAILURE_MESSAGE);
    await app.user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    await waitFor(() => expect(thread().getByText('Olá, Ana!')).toBeVisible());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(thread().getAllByText('Oi')).toHaveLength(1);
  });

  it('mostra o erro anterior ao aceite sem oferecer nova tentativa', async () => {
    serveConversation(makeConversationView());
    const error = { code: 'turn_in_progress', message: 'Aguarde a resposta anterior.' };
    servePost('/messages', () => HttpResponse.json({ error }, { status: 409 }));
    const app = renderWithProviders(<ChatPage />);
    await sendText(app, 'Oi');
    expect(await screen.findByRole('alert')).toHaveTextContent('Aguarde a resposta anterior.');
    expect(screen.queryByRole('button', { name: 'Tentar novamente' })).not.toBeInTheDocument();
  });

  it('mostra o histórico e oferece tentar de novo quando o último turno falhou', async () => {
    const employee = makeChatMessage({ text: 'Minha VPN caiu' });
    const agent = makeChatMessage({ author: 'agent', text: '', status: 'failed' });
    const timeline: ChatMessage[] = [employee, agent];
    serveConversation(makeConversationView({ conversation: makeConversation(), timeline }));
    renderWithProviders(<ChatPage />);
    expect(await screen.findByText('Minha VPN caiu')).toBeVisible();
    expect(screen.getByRole('alert')).toHaveTextContent(FAILURE_MESSAGE);
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeVisible();
  });

  it('mostra sugestões na conversa vazia e envia a escolhida', async () => {
    serveConversation(makeConversationView());
    servePost('/messages', () => completedStream([accepted('Qual o status do meu chamado?', 1)]));
    const app = renderWithProviders(<ChatPage />);
    await app.user.click(
      await screen.findByRole('button', { name: 'Qual o status do meu chamado?' }),
    );
    await waitFor(() => expect(screen.getByText('1/30 mensagens nesta sessão')).toBeVisible());
  });
});
