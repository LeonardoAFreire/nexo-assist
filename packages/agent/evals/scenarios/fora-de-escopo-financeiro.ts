import {
  completedWithoutFailure,
  mentions,
  noProposal,
  notHandedOff,
  skippedStep,
} from '../criteria/index.js';
import type { EvalScenario } from '../types.js';
import { replies, understood } from './rehearsal.js';

export const foraDeEscopoFinanceiro: EvalScenario = {
  id: 'fora-de-escopo-financeiro',
  name: 'Assunto financeiro é redirecionado sem chamado',
  goal: 'scope',
  acceptance: ['CA-26'],
  requester: 'Ana Souza',
  history: [],
  userMessage: 'Meu reembolso da viagem ainda não caiu na conta, quando vão pagar?',
  criteria: [
    noProposal(),
    notHandedOff(),
    skippedStep('built_draft'),
    mentions(/\bTI\b/, 'explica que atende somente assuntos de TI'),
    completedWithoutFailure(),
  ],
  rehearsal: [
    understood('out_of_scope', 'Pergunta sobre reembolso, assunto financeiro'),
    replies('Eu atendo apenas assuntos de TI. Sobre reembolso, fale com o financeiro.'),
  ],
};
