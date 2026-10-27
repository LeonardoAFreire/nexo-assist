import {
  citedArticle,
  completedWithoutFailure,
  mentions,
  noProposal,
  notHandedOff,
  usedStep,
} from '../criteria/index.js';
import type { EvalScenario } from '../types.js';
import { replies, understood } from './rehearsal.js';

export const horarioAtendimento: EvalScenario = {
  id: 'horario-atendimento',
  name: 'Dúvida sobre o horário do service desk',
  goal: 'resolution',
  acceptance: ['CA-04'],
  requester: 'Ana Souza',
  history: [],
  userMessage: 'Qual o horário de atendimento do service desk?',
  criteria: [
    usedStep('searched_knowledge'),
    citedArticle('horario-service-desk', true),
    mentions(/18\s?h|18:00/i, 'informa o fim do expediente (18h)'),
    noProposal(),
    notHandedOff(),
    completedWithoutFailure(),
  ],
  rehearsal: [
    understood('question', 'Dúvida sobre o horário do service desk'),
    replies('O service desk atende de segunda a sexta, das 8h às 18h.', [
      { name: 'buscar_central', input: { query: 'horário service desk' } },
      {
        name: 'citar_artigo',
        input: { articleId: 'horario-service-desk', applies: true, reason: 'responde à dúvida' },
      },
    ]),
  ],
};
