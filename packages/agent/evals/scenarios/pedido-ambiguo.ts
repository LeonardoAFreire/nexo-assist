import {
  anyOf,
  completedWithoutFailure,
  handedOff,
  mentions,
  noProposal,
} from '../criteria/index.js';
import type { EvalScenario } from '../types.js';
import { understood } from './rehearsal.js';

const LOW_CONFIDENCE = 0.3;

export const pedidoAmbiguo: EvalScenario = {
  id: 'pedido-ambiguo',
  name: 'Pedido ambíguo pede esclarecimento ou transfere por baixa confiança',
  goal: 'handoff',
  acceptance: ['CA-19'],
  requester: 'Ana Souza',
  history: [],
  userMessage: 'Está tudo estranho de novo, preciso de ajuda com aquilo.',
  criteria: [
    noProposal(),
    anyOf('clarifies-or-hands-off', 'pediu esclarecimento ou transferiu por baixa confiança', [
      handedOff('low_confidence'),
      mentions(/\?/, 'contém uma pergunta de esclarecimento'),
    ]),
    completedWithoutFailure(),
  ],
  rehearsal: [
    understood('other', 'Pedido sem assunto identificável', { confidence: LOW_CONFIDENCE }),
  ],
};
