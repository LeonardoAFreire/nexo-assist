import { act, screen, waitFor, within } from '@testing-library/react';
import { http as mswHttp } from 'msw';
import { describe, expect, it } from 'vitest';
import { http } from '@/lib/http';
import { consoleApiMock } from '@/test/console-api-mock';
import {
  identityApiMock,
  makeAnalyst,
  makeSessionUser,
  unauthenticatedResponse,
} from '@/test/identity-api-mock';
import { renderApp, type RenderedApp } from '@/test/render';
import { apiUrl, server } from '@/test/server';

const PASSWORD = 'qualquer';
const EMPLOYEE_EMAIL = 'ana.souza@nexo.com.br';
const ANALYST_EMAIL = 'rafael.lima@nexo.com.br';

async function signIn(app: RenderedApp, email: string): Promise<void> {
  await app.user.type(await screen.findByLabelText('E-mail corporativo'), email);
  await app.user.type(screen.getByLabelText('Senha'), PASSWORD);
  await app.user.click(screen.getByRole('button', { name: 'Entrar' }));
}

async function signedInAs(email: string): Promise<RenderedApp> {
  const accounts = [makeSessionUser(), makeAnalyst()];
  server.use(...identityApiMock(accounts), ...consoleApiMock([], makeAnalyst()).handlers);
  const app = renderApp('/login');
  await signIn(app, email);
  return app;
}

describe('identity (TI-27)', () => {
  it('manda o funcionário para o atendimento após o login', async () => {
    const app = await signedInAs(EMPLOYEE_EMAIL);
    expect(await screen.findByRole('heading', { name: 'Atendimento' })).toBeVisible();
    expect(app.currentPath()).toBe('/atendimento');
  });

  it('manda o analista para o console após o login', async () => {
    const app = await signedInAs(ANALYST_EMAIL);
    expect(await screen.findByRole('heading', { name: 'Conversas' })).toBeVisible();
    expect(app.currentPath()).toBe('/console');
  });

  it('mostra erro genérico quando o e-mail é desconhecido', async () => {
    const app = await signedInAs('intruso@nexo.com.br');
    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos.');
    expect(app.currentPath()).toBe('/login');
  });

  it('mostra nome, e-mail e redefinir senha desabilitado no perfil', async () => {
    const app = await signedInAs(EMPLOYEE_EMAIL);
    await app.user.click(await screen.findByRole('link', { name: 'Meu perfil' }));
    expect(await screen.findByRole('heading', { name: 'Meu perfil' })).toBeVisible();
    const profile = within(screen.getByRole('main'));
    expect(profile.getByText('Ana Souza')).toBeVisible();
    expect(profile.getByText(EMPLOYEE_EMAIL)).toBeVisible();
    expect(profile.getByText('Gerenciado pela TI')).toBeVisible();
    expect(profile.getByRole('button', { name: 'Redefinir senha' })).toBeDisabled();
  });

  it('volta ao login ao sair', async () => {
    const app = await signedInAs(EMPLOYEE_EMAIL);
    await app.user.click(await screen.findByRole('button', { name: 'Sair' }));
    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeVisible();
    expect(app.currentPath()).toBe('/login');
  });

  it('manda para o login quem acessa uma rota protegida sem sessão', async () => {
    server.use(...identityApiMock([]));
    const app = renderApp('/perfil');
    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeVisible();
    expect(app.currentPath()).toBe('/login');
  });

  it('leva o analista de volta ao console ao abrir o atendimento', async () => {
    const app = await signedInAs(ANALYST_EMAIL);
    await screen.findByRole('heading', { name: 'Conversas' });
    await act(() => app.router.navigate('/atendimento'));
    await waitFor(() => expect(app.currentPath()).toBe('/console'));
  });

  it('volta ao login quando uma chamada responde 401 durante a sessão', async () => {
    const app = await signedInAs(EMPLOYEE_EMAIL);
    await screen.findByRole('heading', { name: 'Atendimento' });
    server.use(mswHttp.get(apiUrl('/tickets'), () => unauthenticatedResponse()));
    await act(() => http.get('/tickets').catch(() => undefined));
    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeVisible();
    expect(app.currentPath()).toBe('/login');
  });
});
