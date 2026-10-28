import { Outlet } from 'react-router';
import { useSession } from '@/modules/identity';
import { ConsoleShell } from './console-shell';
import { navItemsFor } from './nav-items';
import { Sidebar } from './sidebar';
import { TopBar } from './top-bar';

export function AppShell() {
  const { data: user } = useSession();
  if (!user) {
    return null;
  }
  if (user.role === 'analyst') {
    return <ConsoleShell user={user} />;
  }
  const items = navItemsFor(user.role);
  return (
    <div className="flex h-screen flex-col bg-paper text-ink md:flex-row">
      <Sidebar user={user} items={items} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar items={items} />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
