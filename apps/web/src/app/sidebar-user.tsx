import type { SessionUser } from '@nexo/contracts';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLogout } from '@/modules/identity';

type SidebarUserProps = {
  user: SessionUser;
};

export function SidebarUser({ user }: SidebarUserProps) {
  const { mutate: logout, isPending } = useLogout();
  return (
    <div className="mt-auto flex flex-col gap-1 border-t border-rule pt-3.5">
      <div className="flex items-center gap-2.5 px-2 pb-2">
        <span
          aria-hidden="true"
          className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-primary-soft text-[12.5px] font-bold text-primary-text"
        >
          {user.initials}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13.5px] font-semibold text-ink">{user.name}</p>
          <p className="truncate text-[11.5px] text-ink-3">{user.email}</p>
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        disabled={isPending}
        onClick={() => logout()}
        className="h-[34px] justify-start gap-2.5 px-2.5 text-[13.5px] font-medium text-ink-2"
      >
        <LogOut aria-hidden="true" className="size-4 text-ink-3" />
        Sair
      </Button>
    </div>
  );
}
