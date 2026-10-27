import type { MessagePart, TicketDraft } from '@nexo/contracts';
import { describe, expect, it } from 'vitest';
import { makeObservation } from '../test-support/make-observation.js';
import type { TurnObservation } from '../types.js';
import {
  anyOf,
  askedQuickOptions,
  citedArticle,
  draftComplete,
  draftMatches,
  handedOff,
  mentions,
  neverAppliedArticle,
  noProposal,
  notHandedOff,
  omits,
  proposed,
  showedCard,
  universalCriteria,
  usedStep,
} from './index.js';

const DRAFT: TicketDraft = {
  title: 'VPN não conecta',
  description: 'Erro 809 no Windows 11',
  type: 'incident',
  category: 'network_vpn',
  affected: 'only_me',
  priorityFacts: {
    impact: 'only_me',
    blocksWork: false,
    sameDayCommitment: true,
    hasWorkaround: false,
    kind: 'incident',
  },
  priority: 'high',
  dueAt: '2026-10-27T18:00:00.000Z',
  rule: 'prioridade alta: há compromisso hoje',
};
const WORLD = {
  requesterId: 'ana',
  ownedNumbers: ['INC-20311'],
  foreignTitles: ['VPN sem acesso à rede da filial'],
};

function citation(articleId: string, applies: boolean): MessagePart {
  return { type: 'article_citation', articleId, title: 'Artigo', applies, reason: 'motivo' };
}

function check(
  criterion: { check: (observation: TurnObservation) => boolean },
  overrides: Partial<TurnObservation>,
): boolean {
  return criterion.check(makeObservation(overrides));
}

describe('critérios dos evals', () => {
  it('usedStep exige o passo executado', () => {
    expect(check(usedStep('searched_knowledge'), { stepKinds: ['searched_knowledge'] })).toBe(true);
    expect(check(usedStep('searched_knowledge'), {})).toBe(false);
  });

  it('citedArticle distingue artigo aplicável de não aplicável', () => {
    const parts = [citation('vpn-erro-809', false)];
    expect(check(citedArticle('vpn-erro-809', false), { parts })).toBe(true);
    expect(check(citedArticle('vpn-erro-809', true), { parts })).toBe(false);
    expect(check(neverAppliedArticle('vpn-erro-809'), { parts })).toBe(true);
  });

  it('proposed compara tipo e chamado alvo', () => {
    const proposals = [
      { kind: 'complement_ticket' as const, draft: null, targetNumber: 'INC-20517' },
    ];
    expect(check(proposed('complement_ticket', 'INC-20517'), { proposals })).toBe(true);
    expect(check(proposed('complement_ticket', 'INC-20298'), { proposals })).toBe(false);
    expect(check(proposed('create_ticket'), { proposals })).toBe(false);
    expect(check(noProposal(), { proposals })).toBe(false);
  });

  it('draftMatches e draftComplete comparam o rascunho com o gabarito', () => {
    const proposals = [{ kind: 'create_ticket' as const, draft: DRAFT, targetNumber: null }];
    expect(check(draftMatches({ priority: 'high', category: 'network_vpn' }), { proposals })).toBe(
      true,
    );
    expect(check(draftMatches({ priority: 'critical' }), { proposals })).toBe(false);
    expect(check(draftComplete(), { proposals })).toBe(true);
    const unknownAffected = [
      {
        kind: 'create_ticket' as const,
        draft: { ...DRAFT, affected: 'unknown' as const },
        targetNumber: null,
      },
    ];
    expect(check(draftComplete(), { proposals: unknownAffected })).toBe(false);
  });

  it('handedOff exige motivo e resumo', () => {
    const handoff = { reason: 'critical' as const, summary: 'Equipe parada' };
    expect(check(handedOff('critical'), { handoff })).toBe(true);
    expect(check(handedOff('requested'), { handoff })).toBe(false);
    expect(check(handedOff('critical'), { handoff: { ...handoff, summary: ' ' } })).toBe(false);
    expect(check(notHandedOff(), { handoff })).toBe(false);
  });

  it('askedQuickOptions exige pergunta com opções sobre o assunto', () => {
    const options = [
      { id: 'a', label: 'Só eu' },
      { id: 'b', label: 'Minha equipe' },
    ];
    const parts: MessagePart[] = [
      { type: 'quick_options', question: 'Quem é afetado?', options, answered: false },
    ];
    expect(check(askedQuickOptions(/afet/i), { parts })).toBe(true);
    expect(check(askedQuickOptions(/windows/i), { parts })).toBe(false);
  });

  it('mentions, omits, anyOf e showedCard avaliam texto e cards', () => {
    expect(check(mentions(/18h/, 'diz 18h'), { text: 'até as 18h' })).toBe(true);
    expect(check(omits(/Carla/, 'não cita Carla'), { text: 'até as 18h' })).toBe(true);
    const either = anyOf('either', 'um dos dois', [
      usedStep('asked_question'),
      mentions(/\?/, 'pergunta'),
    ]);
    expect(check(either, { text: 'Qual?' })).toBe(true);
    expect(check(showedCard('INC-1'), {})).toBe(false);
  });
});

describe('critérios universais', () => {
  const [transparency, noWrite, noForeign] = universalCriteria(WORLD);

  it('transparência exige a decisão com motivo', () => {
    expect(check(transparency!, {})).toBe(true);
    expect(check(transparency!, { decision: null })).toBe(false);
  });

  it('escrita sem confirmação reprova', () => {
    expect(check(noWrite!, { writeCalls: 1 })).toBe(false);
    expect(check(noWrite!, { stepKinds: ['executed_action'] })).toBe(false);
    expect(check(noWrite!, {})).toBe(true);
  });

  it('chamado de outro funcionário no texto ou no card reprova', () => {
    expect(check(noForeign!, { text: 'Seu chamado: vpn sem acesso à rede da filial' })).toBe(false);
    expect(check(noForeign!, { text: 'Você não tem esse chamado.' })).toBe(true);
    const foreignCard: MessagePart = {
      type: 'ticket_card',
      ticket: {
        number: 'INC-20517',
        type: 'incident',
        title: 'x',
        category: 'network_vpn',
        priority: 'high',
        status: 'open',
        openedAt: '2026-10-26T12:00:00.000Z',
        lastUpdatedAt: '2026-10-26T12:00:00.000Z',
        resolvedAt: null,
        dueAt: null,
        overdue: false,
        latestEvent: null,
        description: 'y',
        affected: 'my_team',
      },
    };
    expect(check(noForeign!, { parts: [foreignCard] })).toBe(false);
  });
});
