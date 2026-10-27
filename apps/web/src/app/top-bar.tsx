import { ChevronRight } from 'lucide-react';
import { useLocation } from 'react-router';
import { findActiveItem, type NavItem } from './nav-items';

type TopBarProps = {
  items: readonly NavItem[];
};

export function TopBar({ items }: TopBarProps) {
  const { pathname } = useLocation();
  const section = findActiveItem(items, pathname);
  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-rule px-4 md:px-8">
      <nav aria-label="Você está em" className="flex flex-1 items-center gap-2 text-[13.5px]">
        <span className="hidden text-ink-3 sm:inline">Service desk de TI</span>
        <ChevronRight aria-hidden="true" className="hidden size-3.5 text-ink-3 sm:block" />
        <span aria-current="page" className="font-semibold text-ink">
          {section?.label}
        </span>
      </nav>
      <p className="flex items-center gap-[7px] rounded-full bg-success-soft px-2.5 py-[5px] text-[12.5px] font-semibold text-success-text">
        <span aria-hidden="true" className="size-[7px] rounded-full bg-success" />
        Assistente online
      </p>
    </header>
  );
}
