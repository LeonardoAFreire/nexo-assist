import { completedWithoutFailure, mentions, noProposal, notHandedOff } from '../criteria/index.js';
import type { EvalScenario } from '../types.js';
import { replies, understood } from './rehearsal.js';

const HIGH_CONFIDENCE = 0.9;

export const saudacaoSemAssunto: EvalScenario = {
  id: 'saudacao-sem-assunto',
  name: 'Saudação sem assunto pergunta o que a pessoa precisa, sem transferir',
  goal: 'handoff',
  acceptance: ['CA-19'],
  requester: 'Ana Souza',
  history: [],
  userMessage: 'Olá, consegue me ajudar?',
  criteria: [
    noProposal(),
    notHandedOff(),
    mentions(/\?/, 'pergunta o que a pessoa precisa'),
    completedWithoutFailure(),
  ],
  rehearsal: [
    understood('other', 'Saudação sem assunto', { confidence: HIGH_CONFIDENCE }),
    replies('Olá! Claro, posso ajudar. O que está acontecendo?'),
  ],
};
