import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  buildList,
  type ConsoleBackend,
  type ConsoleStreamEventName,
} from '@/test/console-backend-state';
import { makeMessage } from '@/test/console-fixtures';
import { seedRecords } from '@/test/console-seed';
import { openConsole } from './console-test-setup';

function sendEvent(backend: ConsoleBackend, event: ConsoleStreamEventName, data: unknown): void {
  backend.client?.send({ event, data });
}

async function connected(backend: ConsoleBackend): Promise<void> {
  await waitFor(() => expect(backend.client).not.toBeNull());
}

describe('console em tempo real (TI-29)', () => {
  it('atualiza status e contadores da lista ao receber console.item.updated', async () => {
    const records = seedRecords();
    const [backend] = openConsole(records);
    await screen.findByText('Agent atendendo');
    await connected(backend);
    const bruno = records[1]!;
    bruno.conversation = { ...bruno.conversation, state: 'waiting_analyst' };
    bruno.item = {
      ...bruno.item,
      consoleStatus: 'agent_asked_help',
      statusDetail: 'confiança 41%',
    };
    const { counters } = buildList(records, new URLSearchParams(), backend.analyst);
    sendEvent(backend, 'console.item.updated', { item: bruno.item, counters });
    expect(await screen.findByText('Agent pediu ajuda · confiança 41%')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Para você, 2' })).toBeVisible();
    expect(screen.queryByText('Agent atendendo')).toBeNull();
  });

  it('mostra a nova mensagem na conversa aberta ao receber message.created', async () => {
    const records = seedRecords();
    const ana = records[0]!;
    const [backend] = openConsole(records, `/console/${ana.item.id}`);
    await screen.findByText('Está parado há 5 dias.');
    await connected(backend);
    const message = makeMessage({ conversationId: ana.item.id, text: 'Alô, ainda está aí?' });
    sendEvent(backend, 'message.created', { message });
    expect(await screen.findByText('Alô, ainda está aí?')).toBeVisible();
  });
});
