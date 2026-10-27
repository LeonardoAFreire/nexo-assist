import {
  completedWithoutFailure,
  mentions,
  noProposal,
  notHandedOff,
  skippedStep,
} from '../criteria/index.js';
import type { EvalScenario } from '../types.js';
import { replies, understood } from './rehearsal.js';

export const foraDeEscopoRh: EvalScenario = {
  id: 'fora-de-escopo-rh',
  name: 'Assunto de RH é redirecionado sem chamado',
  goal: 'scope',
  acceptance: ['CA-26'],
  requester: 'Elisa Prado',
  history: [],
  userMessage: 'Quantos dias de férias eu ainda tenho e como peço adiantamento do 13º?',
  criteria: [
    noProposal(),
    notHandedOff(),
    skippedStep('built_draft'),
    mentions(/\bTI\b/, 'explica que atende somente assuntos de TI'),
    completedWithoutFailure(),
  ],
  rehearsal: [
    understood('out_of_scope', 'Pergunta de férias e 13º, assunto de RH'),
    replies('Eu atendo apenas assuntos de TI. Para férias e 13º, procure o RH.'),
  ],
};
