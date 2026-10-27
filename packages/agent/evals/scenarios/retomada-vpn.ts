import { completedWithoutFailure, noProposal, showedCard, usedStep } from '../criteria/index.js';
import type { EvalScenario } from '../types.js';
import { agentSays, employeeSays, replies, understood } from './rehearsal.js';

const REQUESTER = 'Carla Mendes';

export const retomadaVpn: EvalScenario = {
  id: 'retomada-vpn',
  name: 'Retomada da conversa identifica o chamado da VPN pelo contexto',
  goal: 'resolution',
  acceptance: ['CA-22'],
  requester: REQUESTER,
  history: [
    employeeSays(REQUESTER, 'Ontem a VPN da filial parou para toda a equipe de Operações.'),
    agentSays('Abri o INC-20517 com prioridade alta. Um analista vai atualizar o chamado.'),
  ],
  userMessage: 'E aquele chamado da VPN?',
  criteria: [
    usedStep('viewed_ticket'),
    showedCard('INC-20517'),
    noProposal(),
    completedWithoutFailure(),
  ],
  rehearsal: [
    understood('ticket_status', 'Retoma o chamado da VPN citado antes', {
      entities: { ticketNumber: 'INC-20517' },
    }),
    replies('O INC-20517 segue aberto e aguardando atendimento.', [
      { name: 'mostrar_chamado', input: { number: 'INC-20517' } },
    ]),
  ],
};
