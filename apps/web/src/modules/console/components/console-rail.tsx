import type { ReactNode } from 'react';
import { MessageCircle } from 'lucide-react';
import { NavLink } from 'react-router';
import { NexoMark } from '@/components/nexo-mark';
import { routePaths } from '@/lib/routes';
import { cn } from '@/lib/utils';
import { useConsoleConversations } from '../hooks/use-console-conversations.js';

type ConsoleRailProps = {
  accountMenu: ReactNode;
};

const NO_FILTER = { filter: 'all', q: '' } as const;

function linkClassName({ isActive }: { isActive: boolean }): string {
  return cn(
    'relative flex size-10 items-center justify-center rounded-xl text-ink outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
    isActive ? 'bg-paper shadow-[0_1px_2px_#1b24311a]' : 'text-ink-2 hover:bg-paper/60',
  );
}

function PendingBadge({ count }: { count: number }) {
  if (count === 0) {
    return null;
  }
  return (
    <span
      aria-label={`${count} para você`}
      className="absolute top-1 left-6 flex h-4 items-center justify-center rounded-full border-2 border-desk bg-cta px-[5px] text-[10px] font-bold text-white box-content"
    >
      {count}
    </span>
  );
}

export function ConsoleRail({ accountMenu }: ConsoleRailProps) {
  const counters = useConsoleConversations(NO_FILTER).data?.counters;
  return (
    <aside className="flex w-16 shrink-0 flex-col items-center gap-1.5 border-r border-rule bg-desk py-4">
      <div className="flex size-10 items-center justify-center pb-2">
        <NexoMark className="size-[22px] text-[#037af6]" />
      </div>
      <nav aria-label="Principal">
        <NavLink to={routePaths.console} aria-label="Conversas" className={linkClassName}>
          <MessageCircle aria-hidden="true" className="size-[19px]" />
          <PendingBadge count={counters?.for_you ?? 0} />
        </NavLink>
      </nav>
      {accountMenu}
    </aside>
  );
}
