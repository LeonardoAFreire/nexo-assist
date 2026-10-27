import type { ConsoleConversationItem, ConsoleStatus } from '@nexo/contracts';

const statusLabels: Record<ConsoleStatus, string> = {
  transferred: 'Transferida',
  agent_asked_help: 'Agent pediu ajuda',
  agent_attending: 'Agent atendendo',
  you_are_attending: 'Você está atendendo',
  attended_by_other: 'Atendida por',
  resolved_by_agent: 'Resolvida pelo agent',
  closed: 'Encerrada',
};

const attentionStatuses: readonly ConsoleStatus[] = ['transferred', 'agent_asked_help'];

export function formatConsoleStatus(item: ConsoleConversationItem): string {
  const label = statusLabels[item.consoleStatus];
  if (!item.statusDetail) {
    return label;
  }
  const separator = item.consoleStatus === 'attended_by_other' ? ' ' : ' · ';
  return `${label}${separator}${item.statusDetail}`;
}

export function needsAttention(status: ConsoleStatus): boolean {
  return attentionStatuses.includes(status);
}
