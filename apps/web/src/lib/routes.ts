import type { UserRole } from '@nexo/contracts';

export const routePaths = {
  login: '/login',
  chat: '/atendimento',
  profile: '/perfil',
  console: '/console',
} as const;

const homePathByRole: Record<UserRole, string> = {
  employee: routePaths.chat,
  analyst: routePaths.console,
};

export function homePathFor(role: UserRole): string {
  return homePathByRole[role];
}
