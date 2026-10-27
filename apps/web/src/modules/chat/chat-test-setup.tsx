import type { ChatStreamEvent, EmployeeConversationView } from '@nexo/contracts';
import { screen, within } from '@testing-library/react';
import { HttpResponse, http as mswHttp } from 'msw';
import { currentConversationMock } from '@/test/chat-api-mock';
import { conversationEventsMock, type ConversationEventsBackend } from '@/test/chat-events-mock';
import { makeChatMessage, makeConversation } from '@/test/chat-factories';
import { renderWithProviders, type RenderedUi } from '@/test/render';
import { apiUrl, server } from '@/test/server';
import { ChatPage } from './pages/chat-page.js';

export const CURRENT = '/conversations/current';
export const COMPOSER_NAME = 'Mensagem para o Nexo';

export type ChatHarness = {
  app: RenderedUi;
  events: ConversationEventsBackend;
};

export function openChat(view: EmployeeConversationView): ChatHarness {
  const events = conversationEventsMock();
  server.use(currentConversationMock(view), events.handler);
  return { app: renderWithProviders(<ChatPage />), events };
}

export function thread(): ReturnType<typeof within> {
  return within(screen.getByRole('list', { name: 'Mensagens' }));
}

export function accepted(text: string): ChatStreamEvent {
  const message = makeChatMessage({ text });
  const usage = { messagesUsed: 1, messagesLimit: 30 };
  return { event: 'message.accepted', data: { message, usage } };
}

export function completedReply(text: string): ChatStreamEvent {
  const message = makeChatMessage({ author: 'agent', text });
  const usage = { messagesUsed: 1, messagesLimit: 30 };
  return { event: 'turn.completed', data: { message, conversation: makeConversation(), usage } };
}

export type RequestLog<Body> = {
  bodies: Body[];
};

export function recordPost<Body>(path: string, respond: () => Response): RequestLog<Body> {
  const log: RequestLog<Body> = { bodies: [] };
  server.use(
    mswHttp.post(apiUrl(`${CURRENT}${path}`), async ({ request }) => {
      log.bodies.push((await request.json()) as Body);
      return respond();
    }),
  );
  return log;
}

export function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return HttpResponse.json(body, { status });
}
