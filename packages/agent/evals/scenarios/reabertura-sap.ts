import {
  completedWithoutFailure,
  neverProposed,
  notHandedOff,
  proposed,
} from '../criteria/index.js';
import type { EvalScenario } from '../types.js';
import { replies, understood } from './rehearsal.js';

export const reaberturaSap: EvalScenario = {
  id: 'reabertura-sap',
  name: 'Senha do SAP bloqueada de novo reabre o chamado resolvido',
  goal: 'no_duplicates',
  acceptance: ['CA-16'],
  requester: 'Ana Souza',
  history: [],
  userMessage: 'A senha do SAP bloqueou de novo e não consigo lançar notas.',
  criteria: [
    proposed('reopen_ticket', 'INC-20150'),
    neverProposed('create_ticket'),
    notHandedOff(),
    completedWithoutFailure(),
  ],
  rehearsal: [
    understood('ticket_complement', 'Senha do SAP bloqueada novamente'),
    replies('O INC-20150 foi resolvido há 4 dias e pode ser reaberto. Você confirma?', [
      { name: 'buscar_chamados', input: { query: 'SAP', scope: 'all' } },
      {
        name: 'propor_reabertura',
        input: { number: 'INC-20150', reason: 'A senha do SAP bloqueou de novo.' },
      },
    ]),
  ],
};
