import type { UserRole } from '@nexo/contracts';
import { MessageSquare, MessagesSquare, UserRound, type LucideIcon } from 'lucide-react';
import { routePaths } from '@/lib/routes';

export type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
};

const profileItem: NavItem = { label: 'Meu perfil', to: routePaths.profile, icon: UserRound };

const navItemsByRole: Record<UserRole, readonly NavItem[]> = {
  employee: [{ label: 'Atendimento', to: routePaths.chat, icon: MessageSquare }, profileItem],
  analyst: [{ label: 'Conversas', to: routePaths.console, icon: MessagesSquare }, profileItem],
};

export function navItemsFor(role: UserRole): readonly NavItem[] {
  return navItemsByRole[role];
}

export function findActiveItem(items: readonly NavItem[], pathname: string): NavItem | undefined {
  return items.find((item: NavItem) => pathname.startsWith(item.to));
}
