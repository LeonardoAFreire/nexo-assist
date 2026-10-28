import type { SessionUser } from '@nexo/contracts';
import { Outlet } from 'react-router';
import { ConsoleRail } from '@/modules/console';
import { RailAccountMenu } from './rail-account-menu';

type ConsoleShellProps = {
  user: SessionUser;
};

export function ConsoleShell({ user }: ConsoleShellProps) {
  return (
    <div className="flex h-screen bg-paper text-ink">
      <ConsoleRail accountMenu={<RailAccountMenu user={user} />} />
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
