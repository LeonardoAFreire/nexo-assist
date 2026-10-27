import type { EvalTicketSpec } from './ticket-spec.js';

const ANA = 'Ana Souza';

export const anaTicketSpecs: EvalTicketSpec[] = [
  {
    number: 'INC-20311',
    title: 'Notebook lento após atualização do Windows',
    description:
      'Lentidão geral desde a atualização de 15/10. Reiniciar e rodar o diagnóstico da central não resolveu.',
    category: 'hardware',
    priority: 'medium',
    status: 'awaiting_analyst',
    owner: ANA,
    openedDaysAgo: 12,
    updatedDaysAgo: 6,
    overdue: true,
  },
  {
    number: 'REQ-10442',
    title: 'Segundo monitor para home office',
    description: 'Solicitação de um segundo monitor para trabalhar em home office.',
    category: 'hardware',
    priority: 'low',
    status: 'approved',
    owner: ANA,
    openedDaysAgo: 10,
    updatedDaysAgo: 7,
  },
  {
    number: 'INC-20150',
    title: 'Senha do SAP bloqueada',
    description: 'A senha do SAP bloqueou depois de três tentativas e não consigo lançar notas.',
    category: 'access',
    priority: 'medium',
    status: 'resolved',
    owner: ANA,
    openedDaysAgo: 8,
    updatedDaysAgo: 4,
  },
  {
    number: 'INC-20298',
    title: 'Excel fecha sozinho ao abrir planilhas grandes',
    description: 'O Excel encerra sem aviso ao abrir as planilhas de fechamento mensal.',
    category: 'software',
    priority: 'medium',
    status: 'in_progress',
    owner: ANA,
    openedDaysAgo: 3,
    updatedDaysAgo: 1,
  },
  {
    number: 'INC-19877',
    title: 'Caixa de e-mail cheia no Outlook',
    description:
      'O Outlook avisa que a caixa de e-mail atingiu o limite e parou de receber mensagens.',
    category: 'email',
    priority: 'low',
    status: 'resolved',
    owner: ANA,
    openedDaysAgo: 55,
    updatedDaysAgo: 54,
  },
  {
    number: 'INC-19410',
    title: 'VPN cai a cada poucos minutos',
    description:
      'A conexão com a VPN é interrompida várias vezes por hora durante o trabalho remoto.',
    category: 'network_vpn',
    priority: 'medium',
    status: 'resolved',
    owner: ANA,
    openedDaysAgo: 108,
    updatedDaysAgo: 107,
  },
];
