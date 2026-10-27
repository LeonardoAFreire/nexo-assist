import {
  anyOf,
  completedWithoutFailure,
  neverProposed,
  notHandedOff,
  proposed,
  usedStep,
} from '../criteria/index.js';
import type { EvalScenario } from '../types.js';
import { replies, understood } from './rehearsal.js';

export const reaberturaForaDoPrazo: EvalScenario = {
  id: 'reabertura-fora-do-prazo',
  name: 'Chamado resolvido há mais de 7 dias não é reaberto',
  goal: 'no_duplicates',
  acceptance: ['CA-16'],
  requester: 'Ana Souza',
  history: [],
  userMessage: 'Minha caixa de e-mail do Outlook encheu de novo e parei de receber mensagens.',
  criteria: [
    neverProposed('reopen_ticket'),
    neverProposed('complement_ticket'),
    anyOf('new-ticket-or-question', 'propôs chamado novo ou fez a pergunta que falta', [
      proposed('create_ticket'),
      usedStep('asked_question'),
    ]),
    notHandedOff(),
    completedWithoutFailure(),
  ],
  rehearsal: [
    understood('ticket_open', 'Caixa de e-mail cheia de novo'),
    replies('O chamado anterior foi resolvido há mais de 7 dias. Posso abrir um novo?', [
      { name: 'buscar_chamados', input: { query: 'e-mail caixa', scope: 'all' } },
      {
        name: 'propor_chamado',
        input: {
          title: 'Caixa de e-mail cheia no Outlook',
          description: 'A caixa de e-mail atingiu o limite de novo e parou de receber mensagens.',
          type: 'incident',
          category: 'email',
          affected: 'only_me',
          priorityFacts: {
            impact: 'only_me',
            blocksWork: false,
            sameDayCommitment: false,
            hasWorkaround: false,
            kind: 'incident',
          },
        },
      },
    ]),
  ],
};
