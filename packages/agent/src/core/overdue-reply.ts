import type { TicketDetail } from '@nexo/contracts';
import { priorityLabel } from './tools/priority-labels.js';

const DAY_MS = 86_400_000;
const SINGLE_DAY = 1;

export const OVERDUE_QUESTION = 'Quer que eu chame um analista?';

function formatDays(days: number): string {
  return days === SINGLE_DAY ? '1 dia' : `${days} dias`;
}

export function overdueSentence(ticket: TicketDetail, now: Date): string {
  const priority = priorityLabel(ticket.priority);
  const days = Math.floor((now.getTime() - Date.parse(ticket.lastUpdatedAt)) / DAY_MS);
  if (days < SINGLE_DAY) {
    return `O ${ticket.number} já passou do prazo da prioridade ${priority}.`;
  }
  return `O ${ticket.number} está sem atualização há ${formatDays(days)} e já passou do prazo da prioridade ${priority}.`;
}
