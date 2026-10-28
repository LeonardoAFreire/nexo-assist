import type { TicketCategory, TicketPriority, TicketStatus } from '@nexo/contracts';

export const statusLabels: Record<TicketStatus, string> = {
  open: 'Aberto',
  awaiting_analyst: 'Aguardando analista',
  in_progress: 'Em andamento',
  in_service: 'Em atendimento',
  approved: 'Aprovado',
  resolved: 'Resolvido',
};

export const priorityLabels: Record<TicketPriority, string> = {
  critical: 'Crítica',
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
};

export const categoryLabels: Record<TicketCategory, string> = {
  access: 'Acesso',
  network_vpn: 'Rede e VPN',
  hardware: 'Hardware',
  software: 'Software',
  email: 'E-mail',
  other: 'Outros',
};

export const OVERDUE_LABEL = 'prazo vencido';
