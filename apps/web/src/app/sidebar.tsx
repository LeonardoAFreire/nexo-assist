import type { SessionUser } from '@nexo/contracts';
import { NavLink } from 'react-router';
import { NexoMark } from '@/components/nexo-mark';
import { cn } from '@/lib/utils';
import type { NavItem } from './nav-items';
import { SidebarUser } from './sidebar-user';

type SidebarProps = {
  user: SessionUser;
  items: readonly NavItem[];
};

const LINK_BASE =
  'flex h-9 items-center gap-2 rounded-lg px-2 text-[13.5px] whitespace-nowrap outline-none md:gap-2.5 md:px-2.5';
const LINK_FOCUS = 'focus-visible:ring-3 focus-visible:ring-ring/50';

function linkClassName({ isActive }: { isActive: boolean }): string {
  const state = isActive
    ? 'bg-primary-soft font-semibold text-primary-text'
    : 'font-medium text-ink-2 hover:bg-desk';
  return cn(LINK_BASE, LINK_FOCUS, state);
}

export function Sidebar({ user, items }: SidebarProps) {
  return (
    <aside className="flex w-full shrink-0 items-center gap-1.5 border-b border-rule bg-paper px-2 py-2 md:w-58 md:flex-col md:items-stretch md:gap-0 md:border-r md:border-b-0 md:px-3.5 md:pt-5 md:pb-3.5">
      <div className="flex items-center gap-2.5 px-2">
        <NexoMark className="text-[#037af6]" />
        <span className="hidden text-base font-bold tracking-tight text-ink sm:inline">
          Nexo Assist
        </span>
      </div>
      <nav aria-label="Principal" className="flex gap-0.5 md:mt-[22px] md:flex-col">
        {items.map((item: NavItem) => (
          <NavLink key={item.to} to={item.to} className={linkClassName}>
            <item.icon aria-hidden="true" className="size-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <SidebarUser user={user} />
    </aside>
  );
}
