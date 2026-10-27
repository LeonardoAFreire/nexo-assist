import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { identityApiMock } from '@/test/identity-api-mock';
import { renderApp } from '@/test/render';
import { server } from '@/test/server';

describe('login: ajuda para quem esqueceu a senha', () => {
  it('mostra o ramal da TI ao clicar em "Esqueci minha senha"', async () => {
    server.use(...identityApiMock([]));
    const app = renderApp('/login');
    expect(screen.queryByText(/ramal 4000\./)).not.toBeInTheDocument();
    await app.user.click(await screen.findByRole('button', { name: 'Esqueci minha senha' }));
    expect(screen.getByRole('status')).toHaveTextContent(
      'Para redefinir a senha, ligue para o ramal 4000.',
    );
  });
});
