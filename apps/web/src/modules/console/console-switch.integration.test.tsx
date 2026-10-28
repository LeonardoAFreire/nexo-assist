import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { seedRecords } from '@/test/console-seed';
import { openConsole } from './console-test-setup';

describe('console: troca de conversa', () => {
  it('mantém um único painel de conversa e um de chamados ao trocar de conversa', async () => {
    const [, app] = openConsole(seedRecords());
    await app.user.click(await screen.findByRole('link', { name: /Ana Souza/ }));
    await screen.findByRole('heading', { name: 'Ana Souza' });
    await app.user.click(await screen.findByRole('link', { name: /Bruno Tavares/ }));
    await screen.findByRole('heading', { name: 'Bruno Tavares' });
    await waitFor(() =>
      expect(screen.getAllByRole('region', { name: 'Conversa' })).toHaveLength(1),
    );
    expect(screen.getAllByRole('complementary', { name: 'Chamados do funcionário' })).toHaveLength(
      1,
    );
    expect(screen.queryByRole('heading', { name: 'Ana Souza' })).toBeNull();
  });
});
