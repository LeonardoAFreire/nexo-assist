import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { seedRecords } from '@/test/console-seed';
import { openConsole } from './console-test-setup';

describe('console: menu lateral', () => {
  afterEach(() => window.localStorage.clear());

  it('expande para a lateral completa e recolhe de volta para a barra estreita', async () => {
    const [, app] = openConsole(seedRecords());
    expect(screen.queryByText('Nexo Assist')).toBeNull();
    await app.user.click(await screen.findByRole('button', { name: 'Expandir menu' }));
    expect(screen.getByText('Nexo Assist')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Conversas' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Meu perfil' })).toBeVisible();
    expect(screen.getByText('rafael.lima@nexo.com.br')).toBeVisible();
    await app.user.click(screen.getByRole('button', { name: 'Recolher menu' }));
    expect(screen.queryByText('Nexo Assist')).toBeNull();
    expect(screen.getByRole('button', { name: 'Expandir menu' })).toBeVisible();
  });

  it('lembra a escolha ao abrir o console de novo', async () => {
    const [, first] = openConsole(seedRecords());
    await first.user.click(await screen.findByRole('button', { name: 'Expandir menu' }));
    first.unmount();
    openConsole(seedRecords());
    expect(await screen.findByRole('button', { name: 'Recolher menu' })).toBeVisible();
  });
});
