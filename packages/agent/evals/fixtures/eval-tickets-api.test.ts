import { describe, expect, it } from 'vitest';
import { buildEvalWorld, findRequester } from './build-eval-world.js';
import { EvalTicketsApi } from './eval-tickets-api.js';

const NOW = new Date('2026-10-27T12:00:00.000Z');
const ANA = findRequester('Ana Souza').id;
const CARLA = findRequester('Carla Mendes').id;

function makeApi(): EvalTicketsApi {
  return new EvalTicketsApi(buildEvalWorld('Ana Souza', NOW).owned, NOW);
}

describe('EvalTicketsApi', () => {
  it('lista e consulta só os chamados do solicitante', async () => {
    const api = makeApi();
    const open = await api.listOwn({ requesterId: ANA, scope: 'open' });
    expect(open.map((ticket) => ticket.number).sort()).toEqual([
      'INC-20298',
      'INC-20311',
      'REQ-10442',
    ]);
    expect(await api.findOwn({ requesterId: ANA, number: 'INC-20517' })).toBeNull();
    expect(await api.searchOwn({ requesterId: ANA, query: 'vpn filial' })).toHaveLength(1);
  });

  it('marca o INC-20311 como vencido e o INC-20150 como resolvido há 4 dias', async () => {
    const api = makeApi();
    const overdue = await api.findOwn({ requesterId: ANA, number: 'INC-20311' });
    const resolved = await api.findOwn({ requesterId: ANA, number: 'INC-20150' });
    expect(overdue).toMatchObject({ overdue: true, status: 'awaiting_analyst' });
    const elapsedDays =
      (NOW.getTime() - new Date(resolved?.resolvedAt ?? 0).getTime()) / 86_400_000;
    expect(Math.round(elapsedDays)).toBe(4);
  });

  it('encontra chamado aberto equivalente só do mesmo solicitante e categoria', async () => {
    const api = makeApi();
    const text = 'VPN sem acesso aos servidores da filial';
    const own = await api.findDuplicates({ requesterId: CARLA, category: 'network_vpn', text });
    expect(own.openMatches.map((ticket) => ticket.number)).toEqual(['INC-20517']);
    const other = await api.findDuplicates({ requesterId: ANA, category: 'network_vpn', text });
    expect(other.openMatches).toEqual([]);
    const differentCategory = await api.findDuplicates({
      requesterId: CARLA,
      category: 'email',
      text,
    });
    expect(differentCategory.openMatches).toEqual([]);
  });

  it('calcula a prioridade pela matriz do service desk', async () => {
    const api = makeApi();
    const facts = {
      impact: 'only_me' as const,
      blocksWork: false,
      sameDayCommitment: false,
      hasWorkaround: false,
      kind: 'incident' as const,
    };
    expect((await api.assessPriority(facts)).priority).toBe('medium');
    expect((await api.assessPriority({ ...facts, sameDayCommitment: true })).priority).toBe('high');
    expect((await api.assessPriority({ ...facts, kind: 'request' })).priority).toBe('low');
    const critical = await api.assessPriority({ ...facts, impact: 'my_team', blocksWork: true });
    expect(critical).toMatchObject({
      priority: 'critical',
      deadline: { amount: 1, unit: 'clock_hours' },
    });
  });

  it('conta e rejeita qualquer escrita', async () => {
    const api = makeApi();
    await expect(api.create()).rejects.toThrow('Escrita');
    await expect(api.complement()).rejects.toThrow('Escrita');
    await expect(api.reopen()).rejects.toThrow('Escrita');
    expect(api.writeCalls).toBe(3);
  });
});

describe('buildEvalWorld', () => {
  it('separa chamados próprios e de terceiros para a checagem de privacidade', () => {
    const { world } = buildEvalWorld('Ana Souza', NOW);
    expect(world.ownedNumbers).toContain('INC-20311');
    expect(world.ownedNumbers).not.toContain('INC-20517');
    expect(world.foreignTitles).toContain('VPN sem acesso à rede da filial');
  });

  it('recusa funcionário desconhecido', () => {
    expect(() => buildEvalWorld('Fulano', NOW)).toThrow('não encontrado');
  });
});
