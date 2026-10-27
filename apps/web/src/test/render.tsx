import { QueryClient } from '@tanstack/react-query';
import { render, type RenderResult } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router';
import { Providers } from '@/app/providers';
import { appRoutes } from '@/app/routes';

type TestRouter = ReturnType<typeof createMemoryRouter>;

export type RenderedUi = RenderResult & {
  user: UserEvent;
  queryClient: QueryClient;
};

export type RenderedApp = RenderedUi & {
  router: TestRouter;
  currentPath: () => string;
};

function createTestQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

export function renderApp(initialPath: string): RenderedApp {
  const queryClient = createTestQueryClient();
  const router = createMemoryRouter(appRoutes, { initialEntries: [initialPath] });
  const result = render(
    <Providers queryClient={queryClient}>
      <RouterProvider router={router} />
    </Providers>,
  );
  const currentPath = (): string => router.state.location.pathname;
  return { ...result, user: userEvent.setup(), queryClient, router, currentPath };
}

export function renderWithProviders(ui: ReactElement): RenderedUi {
  const queryClient = createTestQueryClient();
  const result = render(
    <Providers queryClient={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </Providers>,
  );
  return { ...result, user: userEvent.setup(), queryClient };
}
