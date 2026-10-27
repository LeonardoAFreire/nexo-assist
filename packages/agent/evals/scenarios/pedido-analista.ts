import { completedWithoutFailure, handedOff, noProposal } from '../criteria/index.js';
import type { EvalScenario } from '../types.js';
import { understood } from './rehearsal.js';

export const pedidoAnalista: EvalScenario = {
  id: 'pedido-analista',
  name: 'Pedido explícito de analista termina em transferência',
  goal: 'handoff',
  acceptance: ['CA-17'],
  requester: 'Bruno Tavares',
  history: [],
  userMessage: 'Prefiro falar com uma pessoa, pode me passar para um analista?',
  criteria: [handedOff('requested'), noProposal(), completedWithoutFailure()],
  rehearsal: [understood('analyst_request', 'Pede para falar com um analista')],
};
