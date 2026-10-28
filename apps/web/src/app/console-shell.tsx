import type { SessionUser } from '@nexo/contracts';
import { Outlet } from 'react-router';
import { ConsoleRail } from '@/modules/console';
import { navItemsFor } from './nav-items';
import { RailAccountMenu } from './rail-account-menu';
import { Sidebar } from './sidebar';
import { useSidebarExpanded } from './use-sidebar-expanded';

type ConsoleShellProps = {
  user: SessionUser;
};

export function ConsoleShell({ user }: ConsoleShellProps) {
  const { expanded, setExpanded } = useSidebarExpanded();
  return (
    <div className="flex h-screen bg-paper text-ink">
      {expanded ? (
        <Sidebar user={user} items={navItemsFor(user.role)} onCollapse={() => setExpanded(false)} />
      ) : (
        <ConsoleRail
          accountMenu={<RailAccountMenu user={user} />}
          onExpand={() => setExpanded(true)}
        />
      )}
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
