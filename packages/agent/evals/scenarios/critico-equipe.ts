import { completedWithoutFailure, draftMatches, handedOff, proposed } from '../criteria/index.js';
import type { EvalScenario } from '../types.js';
import { replies, understood } from './rehearsal.js';

export const criticoEquipe: EvalScenario = {
  id: 'critico-equipe',
  name: 'Equipe inteira parada vira chamado crítico e transferência',
  goal: 'handoff',
  acceptance: ['CA-18'],
  requester: 'Diego Ramos',
  history: [],
  userMessage:
    'O servidor de arquivos do Marketing caiu, a equipe inteira está parada e ninguém consegue trabalhar.',
  criteria: [
    proposed('create_ticket'),
    draftMatches({ type: 'incident', priority: 'critical', affected: 'my_team' }),
    handedOff('critical'),
    completedWithoutFailure(),
  ],
  rehearsal: [
    understood('ticket_open', 'Servidor de arquivos fora do ar para toda a equipe', {
      entities: { impact: 'my_team', blocksWork: true },
    }),
    replies('Prioridade crítica: a equipe está parada. Você confirma o chamado?', [
      {
        name: 'propor_chamado',
        input: {
          title: 'Servidor de arquivos do Marketing fora do ar',
          description: 'A equipe de Marketing inteira está sem acesso ao servidor de arquivos.',
          type: 'incident',
          category: 'hardware',
          affected: 'my_team',
          priorityFacts: {
            impact: 'my_team',
            blocksWork: true,
            sameDayCommitment: false,
            hasWorkaround: false,
            kind: 'incident',
          },
        },
      },
    ]),
  ],
};
