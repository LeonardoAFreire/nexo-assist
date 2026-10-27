import {
  completedWithoutFailure,
  mentions,
  neverProposed,
  notHandedOff,
  proposed,
} from '../criteria/index.js';
import type { EvalScenario } from '../types.js';
import { replies, understood } from './rehearsal.js';

const COMPLEMENT_TEXT = 'O Excel também fecha ao abrir planilhas de outro departamento.';

export const complementoChamado: EvalScenario = {
  id: 'complemento-chamado',
  name: 'Nova informação sobre chamado aberto vira complemento',
  goal: 'no_duplicates',
  acceptance: ['CA-09'],
  requester: 'Ana Souza',
  history: [],
  userMessage:
    'Sobre o chamado do Excel que fecha sozinho: agora ele também fecha quando abro planilhas de outro departamento. Pode anotar isso lá?',
  criteria: [
    proposed('complement_ticket', 'INC-20298'),
    neverProposed('create_ticket'),
    mentions(/confirm/i, 'pede a confirmação antes de atualizar'),
    notHandedOff(),
    completedWithoutFailure(),
  ],
  rehearsal: [
    understood('ticket_complement', 'Complemento do chamado do Excel', {
      entities: { ticketNumber: 'INC-20298' },
    }),
    replies('Preparei o complemento do INC-20298. Você confirma a atualização?', [
      { name: 'buscar_chamados', input: { query: 'Excel', scope: 'open' } },
      { name: 'propor_complemento', input: { number: 'INC-20298', complement: COMPLEMENT_TEXT } },
    ]),
  ],
};
