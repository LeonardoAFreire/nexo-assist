import type { SessionUser } from '@nexo/contracts';
import { LogOut, UserRound } from 'lucide-react';
import { Link } from 'react-router';
import { routePaths } from '@/lib/routes';
import { useLogout } from '@/modules/identity';

type RailAccountMenuProps = {
  user: SessionUser;
};

const MENU_ITEM_CLASS =
  'flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[13.5px] font-medium text-ink-2 outline-none hover:bg-desk focus-visible:ring-3 focus-visible:ring-ring/50';

function AccountMenuPanel({ user }: RailAccountMenuProps) {
  const { mutate: logout, isPending } = useLogout();
  return (
    <div className="absolute bottom-0 left-12 z-10 w-52 rounded-xl border border-rule bg-paper p-1.5 shadow-[0_6px_18px_#1b24311a]">
      <p className="truncate px-2.5 pt-1 text-[13.5px] font-semibold text-ink">{user.name}</p>
      <p className="truncate px-2.5 pb-1.5 text-[11.5px] text-ink-3">{user.email}</p>
      <Link to={routePaths.profile} className={MENU_ITEM_CLASS}>
        <UserRound aria-hidden="true" className="size-4 text-ink-3" />
        Meu perfil
      </Link>
      <button
        type="button"
        disabled={isPending}
        onClick={() => logout()}
        className={MENU_ITEM_CLASS}
      >
        <LogOut aria-hidden="true" className="size-4 text-ink-3" />
        Sair
      </button>
    </div>
  );
}

export function RailAccountMenu({ user }: RailAccountMenuProps) {
  return (
    <details className="group relative mt-auto">
      <summary
        aria-label={`Conta de ${user.name}`}
        className="relative flex size-9 cursor-pointer list-none items-center justify-center rounded-full bg-primary-soft text-[12.5px] font-bold text-primary-text outline-none marker:hidden focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {user.initials}
        <span
          aria-hidden="true"
          className="absolute -right-px -bottom-px box-content size-2.5 rounded-full border-2 border-desk bg-success"
        />
      </summary>
      <AccountMenuPanel user={user} />
    </details>
  );
}
