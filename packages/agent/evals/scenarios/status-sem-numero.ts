import {
  completedWithoutFailure,
  noProposal,
  notHandedOff,
  showedSelection,
  usedStep,
} from '../criteria/index.js';
import type { EvalScenario } from '../types.js';
import { replies, understood } from './rehearsal.js';

const OPEN_TICKET_NUMBERS = ['INC-20311', 'REQ-10442', 'INC-20298'];

export const statusSemNumero: EvalScenario = {
  id: 'status-sem-numero',
  name: 'Status de chamado sem informar o número',
  goal: 'resolution',
  acceptance: ['CA-06'],
  requester: 'Ana Souza',
  history: [],
  userMessage: 'Qual o status do meu chamado?',
  criteria: [
    usedStep('searched_tickets'),
    showedSelection(OPEN_TICKET_NUMBERS.length),
    noProposal(),
    notHandedOff(),
    completedWithoutFailure(),
  ],
  rehearsal: [
    understood('ticket_status', 'Quer saber o status de um chamado sem citar o número'),
    replies('Você tem três chamados abertos. Qual deles quer ver?', [
      { name: 'buscar_chamados', input: { scope: 'open' } },
      { name: 'mostrar_selecao', input: { numbers: OPEN_TICKET_NUMBERS } },
    ]),
  ],
};
