import { Outlet } from 'react-router';
import { useSession } from '@/modules/identity';
import { navItemsFor } from './nav-items';
import { Sidebar } from './sidebar';
import { TopBar } from './top-bar';

export function AppShell() {
  const { data: user } = useSession();
  if (!user) {
    return null;
  }
  const items = navItemsFor(user.role);
  return (
    <div className="flex h-screen bg-paper text-ink">
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
