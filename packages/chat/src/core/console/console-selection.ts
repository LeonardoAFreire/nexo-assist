import type { ConsoleConversationItem, ConsoleCounters, ConsoleFilter } from '@nexo/contracts';
import { normalizeText } from '../matchers/normalize-text.js';
import type { ConsoleSource } from './console-item-builder.js';

export type ConsoleEntry = {
  source: ConsoleSource;
  item: ConsoleConversationItem;
};

export function matchesFilter(
  entry: ConsoleEntry,
  filter: ConsoleFilter,
  viewerId: string,
): boolean {
  const { state, assignedAnalystId } = entry.source.conversation.props;
  if (filter === 'for_you') {
    return state === 'waiting_analyst';
  }
  if (filter === 'with_agent') {
    return state === 'agent';
  }
  if (filter === 'mine') {
    return state === 'with_analyst' && assignedAnalystId === viewerId;
  }
  return true;
}

export function matchesQuery(entry: ConsoleEntry, query: string | undefined): boolean {
  const wanted = normalizeText(query ?? '');
  if (wanted === '') {
    return true;
  }
  const byName = normalizeText(entry.item.employee.name).includes(wanted);
  return byName || entry.item.ticketNumbers.some((number) => number.toLowerCase().includes(wanted));
}

function waitingSince(entry: ConsoleEntry): string | null {
  const { state, handoff } = entry.source.conversation.props;
  return state === 'waiting_analyst' ? (handoff?.handedOffAt ?? null) : null;
}

function compareEntries(first: ConsoleEntry, second: ConsoleEntry): number {
  const firstWaiting = waitingSince(first);
  const secondWaiting = waitingSince(second);
  if (firstWaiting !== null && secondWaiting !== null) {
    return firstWaiting.localeCompare(secondWaiting);
  }
  if (firstWaiting !== null || secondWaiting !== null) {
    return firstWaiting === null ? 1 : -1;
  }
  const firstAt = first.source.conversation.props.lastMessageAt;
  return second.source.conversation.props.lastMessageAt.localeCompare(firstAt);
}

export function sortEntries(entries: readonly ConsoleEntry[]): ConsoleEntry[] {
  return [...entries].sort(compareEntries);
}

export function countEntries(entries: readonly ConsoleEntry[], viewerId: string): ConsoleCounters {
  const count = (filter: ConsoleFilter): number =>
    entries.filter((entry) => matchesFilter(entry, filter, viewerId)).length;
  return {
    all: count('all'),
    for_you: count('for_you'),
    with_agent: count('with_agent'),
    mine: count('mine'),
  };
}
