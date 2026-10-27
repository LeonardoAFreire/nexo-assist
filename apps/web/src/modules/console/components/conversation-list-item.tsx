import type { ConsoleConversationItem } from '@nexo/contracts';
import { NavLink } from 'react-router';
import { routePaths } from '@/lib/routes';
import { cn } from '@/lib/utils';
import { formatConsoleStatus, needsAttention } from './console-status.js';
import { formatListTime } from './format-clock-time.js';
import { moveFocusBetweenLinks } from './move-focus-between-links.js';

type ConversationListItemProps = {
  item: ConsoleConversationItem;
};

function UnreadBadge({ count }: { count: number }) {
  return (
    <span
      aria-label={`${count} não lidas`}
      className="flex h-4 min-w-4 items-center justify-center rounded-full bg-cta px-1.5 text-[10.5px] font-semibold text-white"
    >
      {count}
    </span>
  );
}

function linkClassName({ isActive }: { isActive: boolean }): string {
  return cn(
    'flex gap-3 border-b border-rule px-4 py-3 outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/50',
    isActive ? 'bg-primary-soft' : 'hover:bg-desk',
  );
}

function ItemSummary({ item }: ConversationListItemProps) {
  const statusClass = needsAttention(item.consoleStatus) ? 'text-warning-text' : 'text-ink-3';
  return (
    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className="flex items-center justify-between gap-2">
        <span className="truncate text-[13.5px] font-semibold text-ink">{item.employee.name}</span>
        <time dateTime={item.lastMessage.at} className="text-xs text-ink-3">
          {formatListTime(item.lastMessage.at)}
        </time>
      </span>
      <span className="flex items-center justify-between gap-2">
        <span className="truncate text-[13px] text-ink-2">{item.lastMessage.preview}</span>
        {item.unreadCount > 0 ? <UnreadBadge count={item.unreadCount} /> : null}
      </span>
      <span className={cn('truncate text-xs font-medium', statusClass)}>
        {formatConsoleStatus(item)}
      </span>
    </span>
  );
}

export function ConversationListItem({ item }: ConversationListItemProps) {
  return (
    <li>
      <NavLink
        to={`${routePaths.console}/${item.id}`}
        className={linkClassName}
        onKeyDown={moveFocusBetweenLinks}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary-text">
          {item.employee.initials}
        </span>
        <ItemSummary item={item} />
      </NavLink>
    </li>
  );
}
