import { describe, expect, it } from 'vitest';
import { InMemoryTicketsApi } from '../../persistence/scripted/in-memory-tickets-api.js';
import { makeTicket } from '../../persistence/scripted/make-ticket.js';
import { makeTurnContext } from '../../persistence/scripted/make-turn-context.js';
import { createProporReaberturaTool } from './propor-reabertura.js';

const ANA_ID = '11111111-1111-4111-8111-111111111111';
const BRUNO_ID = '22222222-2222-4222-8222-222222222222';
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const NOW = Date.parse('2026-10-26T13:00:00.000Z');

function resolvedAgo(number: string, elapsedMs: number) {
  const resolvedAt = new Date(NOW - elapsedMs).toISOString();
  return { requesterId: ANA_ID, ticket: makeTicket({ number, status: 'resolved', resolvedAt }) };
}

function makeTool() {
  const tickets = new InMemoryTicketsApi([
    resolvedAgo('INC-20150', 4 * DAY_MS),
    resolvedAgo('INC-20151', 7 * DAY_MS),
    resolvedAgo('INC-20152', 7 * DAY_MS + 60 * 1000),
    resolvedAgo('INC-19877', 9 * DAY_MS),
    { requesterId: ANA_ID, ticket: makeTicket({ number: 'INC-20311' }) },
    { requesterId: BRUNO_ID, ticket: makeTicket({ number: 'INC-20999', status: 'resolved' }) },
  ]);
  return createProporReaberturaTool({ tickets });
}

async function run(number: string) {
  const { context, events } = makeTurnContext({ requesterId: ANA_ID });
  const output = await makeTool().execute({ number, reason: 'voltou a falhar' }, context);
  const proposals = events.filter((event) => event.type === 'proposal');
  return { output, proposals };
}

describe('propor_reabertura', () => {
  it('TU-22: propõe reabrir chamado resolvido há 4 dias', async () => {
    const { output, proposals } = await run('INC-20150');
    expect(output).toMatchObject({
      status: 'proposed',
      rule: 'chamado resolvido há 4 dias: pode ser reaberto',
    });
    expect(proposals).toEqual([
      {
        type: 'proposal',
        kind: 'reopen_ticket',
        draft: null,
        targetNumber: 'INC-20150',
        complement: 'voltou a falhar',
      },
    ]);
  });

  it('TU-22: aceita exatamente 7 dias e recusa 7 dias e 1 minuto', async () => {
    expect((await run('INC-20151')).output.status).toBe('proposed');
    const expired = await run('INC-20152');
    expect(expired.output.status).toBe('rule_violated');
    expect(expired.proposals).toEqual([]);
  });

  it('TU-22: devolve regra violada para chamado resolvido há 9 dias', async () => {
    const { output, proposals } = await run('INC-19877');
    expect(output).toMatchObject({
      status: 'rule_violated',
      rule: 'chamado resolvido há mais de 7 dias: não pode ser reaberto',
    });
    expect(proposals).toEqual([]);
  });

  it('recusa reabrir chamado que ainda está aberto', async () => {
    const { output, proposals } = await run('INC-20311');
    expect(output).toMatchObject({ status: 'rule_violated' });
    expect(proposals).toEqual([]);
  });

  it('trata chamado de outro funcionário como inexistente', async () => {
    const foreign = await run('INC-20999');
    const missing = await run('INC-00001');
    expect(foreign.output).toEqual({ status: 'not_found' });
    expect(foreign.output).toEqual(missing.output);
    expect(foreign.proposals).toEqual([]);
  });

  it('expõe a regra aplicada e rótulos do passo', async () => {
    const tool = makeTool();
    const input = { number: 'INC-20150', reason: 'x' };
    const proposed = (await run('INC-20150')).output;
    expect(tool.stepLabel(input, proposed)).toBe('propôs reabrir o INC-20150');
    expect(tool.rules?.(input, proposed)).toEqual([
      'chamado resolvido há 4 dias: pode ser reaberto',
    ]);
    expect(tool.rules?.(input, { status: 'not_found' })).toEqual([]);
    expect(tool.stepResult(input, { status: 'not_found' })).toBe('chamado não encontrado');
    const violated = (await run('INC-19877')).output;
    expect(tool.stepLabel(input, violated)).toBe('analisou reabrir o INC-20150');
  });
});
