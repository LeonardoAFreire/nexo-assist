import type { ConsoleListQuery } from '@nexo/contracts';

const CONSOLE_SCOPE = 'console';

export const consoleKeys = {
  scope: [CONSOLE_SCOPE] as const,
  lists: [CONSOLE_SCOPE, 'list'] as const,
  list: (query: ConsoleListQuery) => [CONSOLE_SCOPE, 'list', query.filter, query.q ?? ''] as const,
  conversation: (id: string) => [CONSOLE_SCOPE, 'conversation', id] as const,
  tickets: (id: string) => [CONSOLE_SCOPE, 'tickets', id] as const,
};
