import {
  completedWithoutFailure,
  mentions,
  noProposal,
  offeredAnalyst,
  showedCard,
  usedStep,
} from '../criteria/index.js';
import type { EvalScenario } from '../types.js';
import { replies, understood } from './rehearsal.js';

export const chamadoVencido: EvalScenario = {
  id: 'chamado-vencido',
  name: 'Consulta do INC-20311 com prazo vencido',
  goal: 'handoff',
  acceptance: ['CA-07'],
  requester: 'Ana Souza',
  history: [],
  userMessage: 'Como está o INC-20311?',
  criteria: [
    usedStep('viewed_ticket'),
    showedCard('INC-20311'),
    mentions(/vencid|atras|prazo/i, 'informa que o prazo venceu'),
    offeredAnalyst(),
    noProposal(),
    completedWithoutFailure(),
  ],
  rehearsal: [
    understood('ticket_status', 'Consulta o INC-20311', {
      entities: { ticketNumber: 'INC-20311' },
    }),
    replies('O INC-20311 está com o prazo vencido, sem atualização há seis dias.', [
      { name: 'mostrar_chamado', input: { number: 'INC-20311' } },
    ]),
  ],
};
