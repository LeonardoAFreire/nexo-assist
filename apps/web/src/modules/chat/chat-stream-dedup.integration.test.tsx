import type { ChatMessage, ConversationStreamEvent, SendMessageRequest } from '@nexo/contracts';
import { screen, waitFor } from '@testing-library/react';
import { http as mswHttp } from 'msw';
import { describe, expect, it } from 'vitest';
import { controlledStream } from '@/test/chat-api-mock';
import { makeChatMessage, makeConversation, makeConversationView } from '@/test/chat-factories';
import { apiUrl, server } from '@/test/server';
import { COMPOSER_NAME, CURRENT, openChat, thread } from './chat-test-setup.js';

const REPLY_ID = '7c1d0000-0000-4000-8000-0000000000aa';
const USAGE = { messagesUsed: 1, messagesLimit: 30 };

type SentBodies = { bodies: SendMessageRequest[] };

function serveStream(stream: ReturnType<typeof controlledStream>): SentBodies {
  const sent: SentBodies = { bodies: [] };
  server.use(
    mswHttp.post(apiUrl(`${CURRENT}/messages`), async ({ request }) => {
      sent.bodies.push((await request.json()) as SendMessageRequest);
      return stream.response;
    }),
  );
  return sent;
}

function created(message: ChatMessage): ConversationStreamEvent {
  return { event: 'message.created', data: { message } };
}

function marker(text: string): ChatMessage {
  return makeChatMessage({ author: 'system', text });
}

async function clientMessageId(sent: SentBodies): Promise<string> {
  await waitFor(() => expect(sent.bodies).toHaveLength(1));
  const id = sent.bodies[0]?.clientMessageId;
  expect(id).toEqual(expect.any(String));
  return id ?? '';
}

describe('chat sem duplicar mensagens entre os dois canais', () => {
  it('mostra a mensagem do funcionário e a resposta uma vez só quando os eventos chegam antes do turno', async () => {
    const stream = controlledStream();
    const sent = serveStream(stream);
    const { app, events } = openChat(makeConversationView());
    await waitFor(() => expect(events.client).not.toBeNull());
    await app.user.type(
      await screen.findByRole('textbox', { name: COMPOSER_NAME }),
      'Minha VPN caiu{Enter}',
    );
    const employee = makeChatMessage({ id: await clientMessageId(sent), text: 'Minha VPN caiu' });
    events.emit(created(employee));
    events.emit(created(marker('primeiro marcador')));
    expect(await screen.findByText('primeiro marcador')).toBeVisible();
    expect(screen.getAllByText('Minha VPN caiu')).toHaveLength(1);
    stream.push({ event: 'message.accepted', data: { message: employee, usage: USAGE } });
    stream.push({ event: 'turn.started', data: { replyId: REPLY_ID } });
    stream.push({ event: 'turn.text-delta', data: { delta: 'Vamos reconectar.' } });
    expect(await screen.findByText('Vamos reconectar.')).toBeVisible();
    const reply = makeChatMessage({ id: REPLY_ID, author: 'agent', text: 'Vamos reconectar.' });
    events.emit(created(reply));
    events.emit(created(marker('segundo marcador')));
    expect(await screen.findByText('segundo marcador')).toBeVisible();
    stream.push({
      event: 'turn.completed',
      data: { message: reply, conversation: makeConversation(), usage: USAGE },
    });
    stream.close();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Enviar' })).toBeInTheDocument());
    expect(screen.getAllByText('Minha VPN caiu')).toHaveLength(1);
    expect(thread().getAllByText('Vamos reconectar.')).toHaveLength(1);
  });
});

describe('composer do chat', () => {
  it('quebra a linha com Shift+Enter e envia com Enter', async () => {
    const stream = controlledStream();
    const sent = serveStream(stream);
    const { app } = openChat(makeConversationView());
    const composer = await screen.findByRole('textbox', { name: COMPOSER_NAME });
    await app.user.type(composer, 'linha 1{Shift>}{Enter}{/Shift}linha 2');
    expect(composer).toHaveValue('linha 1\nlinha 2');
    expect(sent.bodies).toHaveLength(0);
    await app.user.type(composer, '{Enter}');
    await waitFor(() => expect(sent.bodies[0]?.text).toBe('linha 1\nlinha 2'));
    expect(composer).toHaveValue('');
  });

  it('para a resposta em andamento e libera um novo envio', async () => {
    const stream = controlledStream();
    serveStream(stream);
    const { app } = openChat(makeConversationView());
    const composer = await screen.findByRole('textbox', { name: COMPOSER_NAME });
    await app.user.type(composer, 'Oi{Enter}');
    stream.push({ event: 'turn.started', data: { replyId: REPLY_ID } });
    stream.push({ event: 'turn.text-delta', data: { delta: 'Olá' } });
    expect(await screen.findByText('Olá')).toBeVisible();
    await app.user.click(screen.getByRole('button', { name: 'Parar' }));
    expect(await screen.findByRole('button', { name: 'Enviar' })).toBeInTheDocument();
    expect(composer).toBeEnabled();
  });
});
