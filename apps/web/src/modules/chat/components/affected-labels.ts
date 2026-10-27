import type { TicketAffected } from '@nexo/contracts';

export const affectedLabels: Record<TicketAffected, string> = {
  only_me: 'Só eu',
  my_team: 'Minha equipe',
  whole_company: 'Toda a empresa',
  unknown: 'Não sei',
};

export const pendingKindLabels = {
  create_ticket: 'Rascunho',
  complement_ticket: 'Complemento de chamado',
  reopen_ticket: 'Reabertura de chamado',
} as const;

export const actionStatusLabels = {
  pending: 'aguardando confirmação',
  confirmed: 'confirmada',
  cancelled: 'cancelada',
  superseded: 'substituída por uma nova proposta',
  failed: 'não concluída',
} as const;
