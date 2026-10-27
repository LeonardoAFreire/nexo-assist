import { Navigate, type RouteObject } from 'react-router';
import { routePaths } from '@/lib/routes';
import { LoginPage, ProfilePage } from '@/modules/identity';
import { AppShell } from './app-shell';
import { PlaceholderPage } from './placeholder-page';
import { RequireRole } from './require-role';

export const appRoutes: RouteObject[] = [
  { path: routePaths.login, element: <LoginPage /> },
  { path: '/', element: <Navigate to={routePaths.chat} replace /> },
  {
    element: <RequireRole roles={['employee', 'analyst']} />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: routePaths.profile, element: <ProfilePage /> },
          {
            element: <RequireRole roles={['employee']} />,
            children: [{ path: routePaths.chat, element: <PlaceholderPage title="Atendimento" /> }],
          },
          {
            element: <RequireRole roles={['analyst']} />,
            children: [
              { path: routePaths.console, element: <PlaceholderPage title="Conversas" /> },
              {
                path: `${routePaths.console}/:conversationId`,
                element: <PlaceholderPage title="Conversas" />,
              },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to={routePaths.chat} replace /> },
];
