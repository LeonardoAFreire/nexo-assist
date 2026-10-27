import type { AgentStep, HandoffInfo, Understanding } from '@nexo/contracts';
import { describe, expect, it } from 'vitest';
import { DecisionBuilder, type DecisionInput, labelConfidence } from './decision-builder.js';

const UNDERSTANDING: Understanding = {
  intent: 'ticket_open',
  summary: 'VPN com erro 809 no Windows 11',
  entities: {
    ticketNumber: null,
    operatingSystem: 'Windows 11',
    symptom: null,
    impact: 'only_me',
    sameDayCommitment: false,
    hasWorkaround: null,
    blocksWork: true,
  },
  confidence: 0.86,
  reason: 'o funcionário descreve um problema novo de VPN',
};

const HANDOFF: HandoffInfo = {
  reason: 'requested',
  level: 'N1',
  summary: 'VPN',
  ticketNumbers: [],
  confidence: null,
  contactDueAt: '2026-10-26T15:00:00.000Z',
  handedOffAt: '2026-10-26T13:00:00.000Z',
};

function makeStep(overrides: Partial<AgentStep>): AgentStep {
  return {
    id: 's1',
    kind: 'searched_tickets',
    label: 'consultou seus chamados',
    result: 'nenhum chamado encontrado',
    status: 'ok',
    attempts: 1,
    durationMs: 10,
    ...overrides,
  };
}

function build(overrides: Partial<DecisionInput> = {}) {
  const input: DecisionInput = {
    understanding: UNDERSTANDING,
    steps: [],
    rules: [],
    handoff: null,
    legacyUnavailable: false,
    ...overrides,
  };
  return new DecisionBuilder().build(input);
}

describe('DecisionBuilder', () => {
  it('TU-25: monta a decisão com entendimento, ação, confiança rotulada, motivo e regras', () => {
    const steps = [
      makeStep({}),
      makeStep({ id: 's2', kind: 'classified_priority', label: 'classificou a prioridade' }),
      makeStep({ id: 's3', kind: 'built_draft', label: 'montou o rascunho' }),
    ];
    const decision = build({ steps, rules: ['impacto individual: prioridade média'] });
    expect(decision.understood).toEqual({
      intent: 'ticket_open',
      intentLabel: 'abrir chamado',
      summary: 'VPN com erro 809 no Windows 11',
      entities: [
        { label: 'Sistema', value: 'Windows 11' },
        { label: 'Quem é afetado', value: 'só o funcionário' },
        { label: 'Impede o trabalho', value: 'sim' },
        { label: 'Compromisso no mesmo dia', value: 'não' },
      ],
    });
    expect(decision.action).toEqual({ kind: 'built_draft', label: 'montou o rascunho' });
    expect(decision.confidence).toEqual({ value: 0.86, label: 'alta' });
    expect(decision.reason).toBe(UNDERSTANDING.reason);
    expect(decision.rules).toEqual(['impacto individual: prioridade média']);
    expect(decision.handoff).toBeNull();
  });

  it('rotula a confiança: 0,8 alta; 0,6 média; abaixo disso baixa', () => {
    expect(labelConfidence(0.8).label).toBe('alta');
    expect(labelConfidence(0.79).label).toBe('média');
    expect(labelConfidence(0.6).label).toBe('média');
    expect(labelConfidence(0.59).label).toBe('baixa');
  });

  it('usa a ação degradada, com motivo fixo, quando o legado falha', () => {
    const failed = makeStep({ status: 'failed', attempts: 3, result: 'sistema indisponível' });
    const decision = build({ steps: [failed], legacyUnavailable: true });
    expect(decision.action).toEqual({ kind: 'degraded', label: 'avisou da indisponibilidade' });
    expect(decision.reason).not.toBe(UNDERSTANDING.reason);
  });

  it('usa a ação degradada com o motivo informado quando o turno não conclui por outra causa', () => {
    const decision = build({ degradedReason: 'o limite de passos foi atingido' });
    expect(decision.action).toEqual({
      kind: 'degraded',
      label: 'avisou que não conseguiu concluir',
    });
    expect(decision.reason).toBe('o limite de passos foi atingido');
  });

  it('usa a transferência como ação e inclui os dados do handoff', () => {
    const decision = build({ steps: [makeStep({})], handoff: HANDOFF });
    expect(decision.action.kind).toBe('handed_off');
    expect(decision.handoff).toEqual(HANDOFF);
  });

  it('prefere a ação decisiva à última consulta e ignora passos que falharam', () => {
    const steps = [
      makeStep({ id: 's1', kind: 'proposed_reopen', label: 'propôs reabrir o INC-20150' }),
      makeStep({ id: 's2', kind: 'cited_article', label: 'avaliou o artigo' }),
      makeStep({ id: 's3', kind: 'asked_question', label: 'fez uma pergunta', status: 'failed' }),
    ];
    expect(build({ steps }).action.kind).toBe('proposed_reopen');
  });

  it('usa a última consulta quando não houve ação decisiva e responde direto sem passos', () => {
    const lookups = [
      makeStep({ id: 's1' }),
      makeStep({ id: 's2', kind: 'viewed_ticket', label: 'consultou o INC-20311' }),
    ];
    expect(build({ steps: lookups }).action.kind).toBe('viewed_ticket');
    expect(build().action).toEqual({ kind: 'replied', label: 'respondeu ao funcionário' });
  });

  it('remove regras repetidas e não lista entidades ausentes', () => {
    const understanding = {
      ...UNDERSTANDING,
      entities: {
        ...UNDERSTANDING.entities,
        operatingSystem: null,
        impact: null,
        blocksWork: null,
        sameDayCommitment: null,
      },
    };
    const decision = build({ understanding, rules: ['a', 'b', 'a'] });
    expect(decision.rules).toEqual(['a', 'b']);
    expect(decision.understood.entities).toEqual([]);
  });
});
