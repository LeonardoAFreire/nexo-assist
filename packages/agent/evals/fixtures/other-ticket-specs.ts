import type { EvalTicketSpec } from './ticket-spec.js';

export const otherTicketSpecs: EvalTicketSpec[] = [
  {
    number: 'INC-20517',
    title: 'VPN sem acesso à rede da filial',
    description:
      'Ninguém da equipe de Operações consegue acessar os servidores da filial pela VPN.',
    category: 'network_vpn',
    priority: 'high',
    status: 'open',
    owner: 'Carla Mendes',
    openedDaysAgo: 1,
    updatedDaysAgo: 1,
    affected: 'my_team',
  },
  {
    number: 'REQ-10448',
    title: 'Acesso à pasta de propostas comerciais',
    description: 'Preciso de acesso de leitura à pasta de propostas comerciais no SharePoint.',
    category: 'access',
    priority: 'low',
    status: 'open',
    owner: 'Bruno Tavares',
    openedDaysAgo: 2,
    updatedDaysAgo: 2,
  },
  {
    number: 'INC-20402',
    title: 'Outlook não sincroniza no celular',
    description: 'As mensagens novas não aparecem no Outlook do celular desde a troca de senha.',
    category: 'email',
    priority: 'low',
    status: 'resolved',
    owner: 'Diego Ramos',
    openedDaysAgo: 10,
    updatedDaysAgo: 9,
  },
];
