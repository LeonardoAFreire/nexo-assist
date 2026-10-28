import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { makeEmployee, makeTicketSummary } from '@/test/console-fixtures';
import { seedRecords } from '@/test/console-seed';
import { claimAs, openConsole } from './console-test-setup';

const ANA_LINK = /Ana Souza/;
const BRUNO_LINK = /Bruno Tavares/;

async function openAna(): Promise<ReturnType<typeof openConsole>> {
  const opened = openConsole(seedRecords());
  await opened[1].user.click(await screen.findByRole('link', { name: ANA_LINK }));
  await screen.findByRole('heading', { name: 'Ana Souza' });
  return opened;
}

describe('console do analista (TI-28)', () => {
  it('filtra por "Para você" e busca por número de chamado com contadores coerentes', async () => {
    const [, app] = openConsole(seedRecords());
    expect(await screen.findByRole('link', { name: BRUNO_LINK })).toBeVisible();
    await app.user.click(screen.getByRole('button', { name: /^Para você/ }));
    await waitFor(() => expect(screen.queryByRole('link', { name: BRUNO_LINK })).toBeNull());
    expect(screen.getByRole('link', { name: ANA_LINK })).toBeVisible();
    await app.user.click(screen.getByRole('button', { name: /^Todas/ }));
    await app.user.type(screen.getByLabelText('Pesquisar conversa ou chamado'), 'INC-20311');
    await waitFor(() => expect(screen.queryByRole('link', { name: BRUNO_LINK })).toBeNull());
    expect(screen.getByRole('button', { name: /^Todas, 1/ })).toBeVisible();
  });

  it('mostra mensagem quando nenhuma conversa corresponde à busca', async () => {
    const [, app] = openConsole(seedRecords());
    await app.user.type(await screen.findByLabelText('Pesquisar conversa ou chamado'), 'zzz');
    expect(await screen.findByText('Nenhuma conversa neste filtro')).toBeVisible();
  });

  it('mostra histórico, resumo da transferência e detalhe da decisão do agent', async () => {
    await openAna();
    expect(await screen.findByText('Está parado há 5 dias.')).toBeVisible();
    expect(screen.getByRole('region', { name: 'Resumo da transferência' })).toBeVisible();
    expect(screen.getByRole('button', { name: /ver detalhes da decisão/i })).toBeVisible();
    expect(screen.queryByRole('textbox', { name: /resposta/i })).toBeNull();
  });

  it('assume, responde e devolve ao agent', async () => {
    const [, app] = await openAna();
    await app.user.click(await screen.findByRole('button', { name: 'Assumir atendimento' }));
    const reply = await screen.findByRole('textbox', { name: /resposta ao funcionário/i });
    await app.user.type(reply, 'Vou verificar o driver.');
    await app.user.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(await screen.findByText('Vou verificar o driver.')).toBeVisible();
    expect(screen.getByText(/Rafael Lima assumiu · agent pausado/)).toBeVisible();
    await app.user.click(screen.getByRole('button', { name: 'Devolver ao agent' }));
    await waitFor(() => expect(screen.queryByRole('textbox', { name: /resposta/i })).toBeNull());
    expect(screen.getByText('O agent está atendendo esta conversa')).toBeVisible();
  });

  it('envia a resposta com Enter e quebra a linha com Shift+Enter', async () => {
    const [, app] = await openAna();
    await app.user.click(await screen.findByRole('button', { name: 'Assumir atendimento' }));
    const reply = await screen.findByRole('textbox', { name: /resposta ao funcionário/i });
    await app.user.type(reply, 'Oi, Ana.{Shift>}{Enter}{/Shift}Já estou vendo.');
    expect(reply).toHaveValue('Oi, Ana.\nJá estou vendo.');
    await app.user.type(reply, '{Enter}');
    expect(await screen.findByText(/Já estou vendo\./)).toBeVisible();
    await waitFor(() => expect(reply).toHaveValue(''));
  });

  it('encerra o atendimento assumido', async () => {
    const [, app] = await openAna();
    await app.user.click(await screen.findByRole('button', { name: 'Assumir atendimento' }));
    await app.user.click(await screen.findByRole('button', { name: 'Encerrar atendimento' }));
    expect(await screen.findByText('Conversa encerrada')).toBeVisible();
  });

  it('mostra a recusa clara quando outro analista assumiu antes', async () => {
    const [backend, app] = await openAna();
    const gabriela = makeEmployee({ name: 'Gabriela Rocha', role: 'analyst', supportLevel: 'N1' });
    const claim = await screen.findByRole('button', { name: 'Assumir atendimento' });
    claimAs(backend, 'Ana Souza', gabriela);
    await app.user.click(claim);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Esta conversa já está sendo atendida por Gabriela Rocha.',
    );
    expect(await screen.findByText('Atendida por Gabriela Rocha')).toBeVisible();
  });

  it('lista os chamados do funcionário e permite tentar de novo quando o legado falha', async () => {
    const [backend, app] = await openAna();
    backend.tickets = null;
    await app.user.click(await screen.findByRole('button', { name: 'Assumir atendimento' }));
    const panel = screen.getByRole('complementary', { name: 'Chamados do funcionário' });
    expect(await within(panel).findByRole('alert')).toBeVisible();
    backend.tickets = {
      fromConversation: [makeTicketSummary()],
      others: { open: [], closed: [] },
    };
    await app.user.click(within(panel).getByRole('button', { name: 'Tentar novamente' }));
    expect(await within(panel).findByText('Notebook lento após atualização')).toBeVisible();
  });
});
