import {
  completedWithoutFailure,
  neverProposed,
  notHandedOff,
  proposed,
} from '../criteria/index.js';
import type { EvalScenario } from '../types.js';
import { replies, understood } from './rehearsal.js';

const OPEN_VPN_TICKET = 'INC-20517';

export const duplicidadeVpn: EvalScenario = {
  id: 'duplicidade-vpn',
  name: 'Problema de VPN com chamado aberto atualiza em vez de duplicar',
  goal: 'no_duplicates',
  acceptance: ['CA-15'],
  requester: 'Carla Mendes',
  history: [],
  userMessage:
    'A VPN continua sem acesso aos servidores da filial, voltou a cair agora há pouco. Pode abrir um chamado?',
  criteria: [
    proposed('complement_ticket', OPEN_VPN_TICKET),
    neverProposed('create_ticket'),
    notHandedOff(),
    completedWithoutFailure(),
  ],
  rehearsal: [
    understood('ticket_open', 'VPN da filial sem acesso, já existe chamado aberto'),
    replies('Você já tem o INC-20517 aberto sobre isso. Quer que eu acrescente a novidade?', [
      {
        name: 'propor_chamado',
        input: {
          title: 'VPN sem acesso à rede da filial',
          description: 'A VPN voltou a cair e segue sem acesso aos servidores da filial.',
          type: 'incident',
          category: 'network_vpn',
          affected: 'my_team',
          priorityFacts: {
            impact: 'my_team',
            blocksWork: false,
            sameDayCommitment: false,
            hasWorkaround: false,
            kind: 'incident',
          },
        },
      },
      {
        name: 'propor_complemento',
        input: { number: OPEN_VPN_TICKET, complement: 'A VPN voltou a cair agora há pouco.' },
      },
    ]),
  ],
};
