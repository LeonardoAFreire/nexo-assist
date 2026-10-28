import type { ConsoleConversationItem, ConsoleStatus } from '@nexo/contracts';

type StatusTone = {
  dot: string;
  text: string;
};

const statusLabels: Record<ConsoleStatus, string> = {
  transferred: 'Transferida',
  agent_asked_help: 'Agent pediu ajuda',
  agent_attending: 'Agent atendendo',
  you_are_attending: 'Você está atendendo',
  attended_by_other: 'Atendida por',
  resolved_by_agent: 'Resolvida pelo agent',
  closed: 'Encerrada',
};

const statusTones: Record<ConsoleStatus, StatusTone> = {
  transferred: { dot: 'bg-destructive', text: 'text-danger-text' },
  agent_asked_help: { dot: 'bg-warning', text: 'text-warning-text' },
  agent_attending: { dot: 'bg-success', text: 'text-ink-3' },
  you_are_attending: { dot: 'bg-primary', text: 'text-primary-text' },
  attended_by_other: { dot: 'bg-ink/35', text: 'text-ink-3' },
  resolved_by_agent: { dot: 'bg-ink/35', text: 'text-ink-3' },
  closed: { dot: 'bg-ink/35', text: 'text-ink-3' },
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

export function statusToneOf(status: ConsoleStatus): StatusTone {
  return statusTones[status];
}
