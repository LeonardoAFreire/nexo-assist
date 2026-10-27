import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { setUnauthorizedHandler } from '@/lib/http';
import { makeConversationView } from '@/test/chat-factories';
import { COMPOSER_NAME, jsonResponse, openChat, recordPost } from './chat-test-setup.js';

async function sendText(app: ReturnType<typeof openChat>['app'], text: string): Promise<void> {
  await app.user.type(await screen.findByRole('textbox', { name: COMPOSER_NAME }), text);
  await app.user.click(screen.getByRole('button', { name: 'Enviar' }));
}

describe('erros anteriores ao aceite da mensagem', () => {
  it('restaura o texto digitado quando já existe um turno em andamento', async () => {
    const error = { code: 'turn_in_progress', message: 'Já existe uma resposta em andamento.' };
    const log = recordPost('/messages', () => jsonResponse({ error }, 409));
    const { app } = openChat(makeConversationView());
    await sendText(app, 'Minha pergunta importante');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Já existe uma resposta em andamento.',
    );
    expect(screen.getByRole('textbox', { name: COMPOSER_NAME })).toHaveValue(
      'Minha pergunta importante',
    );
    expect(log.bodies).toHaveLength(1);
  });

  it('avisa a aplicação quando a sessão expirou durante o envio', async () => {
    const error = { code: 'unauthenticated', message: 'Sessão expirada.' };
    recordPost('/messages', () => jsonResponse({ error }, 401));
    const { app } = openChat(makeConversationView());
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    await sendText(app, 'Olá');
    await waitFor(() => expect(onUnauthorized).toHaveBeenCalledTimes(1));
  });
});
