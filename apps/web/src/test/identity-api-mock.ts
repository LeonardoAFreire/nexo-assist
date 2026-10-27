import { loginRequestSchema, type SessionUser } from '@nexo/contracts';
import { HttpResponse, http as mswHttp, type HttpHandler } from 'msw';
import { apiUrl } from './server';

const UNAUTHORIZED_STATUS = 401;
const NO_CONTENT_STATUS = 204;
const SESSION_EXPIRES_AT = '2026-10-27T21:00:00.000Z';

export function makeSessionUser(overrides: Partial<SessionUser> = {}): SessionUser {
  return {
    id: '6f1c2a8e-3b7d-4e55-9a10-1d2f3c4b5a61',
    name: 'Ana Souza',
    email: 'ana.souza@nexo.com.br',
    role: 'employee',
    department: 'Financeiro',
    supportLevel: null,
    initials: 'AS',
    session: { expiresAt: SESSION_EXPIRES_AT },
    ...overrides,
  };
}

export function makeAnalyst(): SessionUser {
  return makeSessionUser({
    id: 'b2d4f6a8-0c1e-4b3d-8f5a-9e7c1a3b5d70',
    name: 'Rafael Lima',
    email: 'rafael.lima@nexo.com.br',
    role: 'analyst',
    department: null,
    supportLevel: 'N2',
    initials: 'RL',
  });
}

export function unauthenticatedResponse(): Response {
  const error = { code: 'unauthenticated', message: 'Faça login para continuar.' };
  return HttpResponse.json({ error }, { status: UNAUTHORIZED_STATUS });
}

export function invalidCredentialsResponse(): Response {
  const error = { code: 'invalid_credentials', message: 'E-mail ou senha incorretos.' };
  return HttpResponse.json({ error }, { status: UNAUTHORIZED_STATUS });
}

export function identityApiMock(accounts: readonly SessionUser[]): HttpHandler[] {
  let current: SessionUser | null = null;
  return [
    mswHttp.get(apiUrl('/auth/me'), () =>
      current ? HttpResponse.json(current) : unauthenticatedResponse(),
    ),
    mswHttp.post(apiUrl('/auth/login'), async ({ request }) => {
      const body = loginRequestSchema.parse(await request.json());
      current = accounts.find((account: SessionUser) => account.email === body.email) ?? null;
      return current ? HttpResponse.json(current) : invalidCredentialsResponse();
    }),
    mswHttp.post(apiUrl('/auth/logout'), () => {
      current = null;
      return new HttpResponse(null, { status: NO_CONTENT_STATUS });
    }),
  ];
}
