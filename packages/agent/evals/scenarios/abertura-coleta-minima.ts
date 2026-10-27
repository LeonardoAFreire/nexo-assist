import {
  completedWithoutFailure,
  didNotAsk,
  draftComplete,
  draftMatches,
  mentions,
  notHandedOff,
  proposed,
  usedStep,
} from '../criteria/index.js';
import type { EvalScenario } from '../types.js';
import { agentSays, employeeSays, replies, understood } from './rehearsal.js';

const REQUESTER = 'Bruno Tavares';
const FIRST_MESSAGE = 'Minha VPN não conecta, erro 809, Windows 11';
const FOLLOW_UP_QUESTION = 'Quem está sem conseguir usar a VPN?';

export const aberturaColetaMinima: EvalScenario = {
  id: 'abertura-coleta-minima',
  name: 'Abertura de chamado com a coleta mínima de dados',
  goal: 'ticket_quality',
  acceptance: ['CA-10', 'CA-11'],
  requester: REQUESTER,
  history: [
    employeeSays(REQUESTER, FIRST_MESSAGE),
    agentSays(`O artigo do erro 809 vale só para Windows 10. ${FOLLOW_UP_QUESTION}`),
  ],
  userMessage: 'Só eu, e tenho uma reunião com cliente às 14h hoje.',
  criteria: [
    usedStep('built_draft'),
    proposed('create_ticket'),
    draftMatches({
      type: 'incident',
      category: 'network_vpn',
      priority: 'high',
      affected: 'only_me',
    }),
    draftComplete(),
    mentions(/compromisso|reuni/i, 'explica o motivo da prioridade'),
    didNotAsk(/windows|sistema operacional/i),
    notHandedOff(),
    completedWithoutFailure(),
  ],
  rehearsal: [
    understood('ticket_open', 'VPN sem conexão, só o funcionário, reunião às 14h', {
      entities: { impact: 'only_me', sameDayCommitment: true },
    }),
    replies('Prioridade alta porque há compromisso hoje. Você confirma o chamado?', [
      {
        name: 'propor_chamado',
        input: {
          title: 'VPN não conecta (erro 809) no Windows 11',
          description: 'VPN com erro 809 no Windows 11. Reunião com cliente hoje às 14h.',
          type: 'incident',
          category: 'network_vpn',
          affected: 'only_me',
          priorityFacts: {
            impact: 'only_me',
            blocksWork: false,
            sameDayCommitment: true,
            hasWorkaround: false,
            kind: 'incident',
          },
        },
      },
    ]),
  ],
};
