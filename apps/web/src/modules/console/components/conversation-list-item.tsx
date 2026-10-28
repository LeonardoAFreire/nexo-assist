import type { ConsoleConversationItem } from '@nexo/contracts';
import { NavLink } from 'react-router';
import { routePaths } from '@/lib/routes';
import { cn } from '@/lib/utils';
import { formatConsoleStatus, needsAttention, statusToneOf } from './console-status.js';
import { formatListTime } from './format-clock-time.js';
import { moveFocusBetweenLinks } from './move-focus-between-links.js';
import { PersonAvatar } from './person-avatar.js';

type ConversationListItemProps = {
  item: ConsoleConversationItem;
};

function UnreadBadge({ count }: { count: number }) {
  return (
    <span
      aria-label={`${count} não lidas`}
      className="flex h-5 min-w-5 items-center justify-center rounded-full bg-cta px-1.5 text-[11.5px] font-bold text-white"
    >
      {count}
    </span>
  );
}

function linkClassName({ isActive }: { isActive: boolean }): string {
  return cn(
    'group flex items-center gap-3 rounded-xl p-2.5 outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/50',
    isActive ? 'bg-desk' : 'hover:bg-desk/60',
  );
}

function StatusTag({ item }: ConversationListItemProps) {
  const tone = statusToneOf(item.consoleStatus);
  return (
    <span className={cn('flex items-center gap-[5px] text-[11.5px] font-medium', tone.text)}>
      <span aria-hidden="true" className={cn('size-1.5 shrink-0 rounded-full', tone.dot)} />
      <span className="truncate">{formatConsoleStatus(item)}</span>
    </span>
  );
}

function ItemTitleRow({ item }: ConversationListItemProps) {
  const emphasized = item.unreadCount > 0 || needsAttention(item.consoleStatus);
  return (
    <span className="flex items-center justify-between gap-2">
      <span
        className={cn(
          'truncate text-[15.5px] text-ink',
          emphasized ? 'font-semibold' : 'font-medium',
        )}
      >
        {item.employee.name}
      </span>
      <time
        dateTime={item.lastMessage.at}
        className={cn(
          'text-[12.5px]',
          item.unreadCount > 0 ? 'font-semibold text-cta' : 'text-ink-3',
        )}
      >
        {formatListTime(item.lastMessage.at)}
      </time>
    </span>
  );
}

function ItemSummary({ item }: ConversationListItemProps) {
  return (
    <span className="flex min-w-0 flex-1 flex-col gap-[3px] border-b border-rule pb-2.5 group-aria-[current=page]:border-transparent">
      <ItemTitleRow item={item} />
      <span className="flex items-center justify-between gap-1.5">
        <span className="truncate text-[13.5px] text-ink-3">{item.lastMessage.preview}</span>
        {item.unreadCount > 0 ? <UnreadBadge count={item.unreadCount} /> : null}
      </span>
      <StatusTag item={item} />
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
        <PersonAvatar
          initials={item.employee.initials}
          className="size-[46px] text-[15.5px] font-semibold"
        />
        <ItemSummary item={item} />
      </NavLink>
    </li>
  );
}
