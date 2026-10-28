import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { seedRecords } from '@/test/console-seed';
import { openConsole } from './console-test-setup';

describe('console: painel de chamados após o atendimento', () => {
  it('troca o erro de carga pelo aviso de acesso quando a conversa é encerrada', async () => {
    const [backend, app] = openConsole(seedRecords());
    await app.user.click(await screen.findByRole('link', { name: /Ana Souza/ }));
    await screen.findByRole('heading', { name: 'Ana Souza' });
    backend.tickets = null;
    await app.user.click(await screen.findByRole('button', { name: 'Assumir atendimento' }));
    const panel = screen.getByRole('complementary', { name: 'Chamados do funcionário' });
    expect(await within(panel).findByRole('alert')).toBeVisible();
    await app.user.click(await screen.findByRole('button', { name: 'Encerrar atendimento' }));
    expect(await screen.findByText('Conversa encerrada')).toBeVisible();
    await waitFor(() => expect(within(panel).queryByRole('alert')).toBeNull());
    expect(
      within(panel).getByText(/ficam disponíveis quando a conversa é transferida/),
    ).toBeVisible();
    expect(within(panel).queryByText(/Tentar novamente/)).toBeNull();
  });
});
