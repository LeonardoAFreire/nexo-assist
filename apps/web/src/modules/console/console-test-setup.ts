import type { UserProfile } from '@nexo/contracts';
import { HttpResponse, http as mswHttp } from 'msw';
import { consoleApiMock } from '@/test/console-api-mock';
import { claimRecord, type ConsoleBackend, type ConsoleRecord } from '@/test/console-backend-state';
import { makeAnalyst } from '@/test/identity-api-mock';
import { renderApp, type RenderedApp } from '@/test/render';
import { apiUrl, server } from '@/test/server';

export function analystProfile(): UserProfile {
  const { id, name, role, department, supportLevel, initials } = makeAnalyst();
  return { id, name, role, department, supportLevel, initials };
}

export function claimAs(backend: ConsoleBackend, employeeName: string, other: UserProfile): void {
  const record = backend.records.find((current) => current.item.employee.name === employeeName);
  if (!record) {
    throw new Error(`Conversa de teste não encontrada: ${employeeName}`);
  }
  claimRecord(record, other);
}

export function openConsole(
  records: ConsoleRecord[],
  path = '/console',
): [ConsoleBackend, RenderedApp] {
  const backend = consoleApiMock(records, analystProfile());
  const session = mswHttp.get(apiUrl('/auth/me'), () => HttpResponse.json(makeAnalyst()));
  server.use(session, ...backend.handlers);
  return [backend, renderApp(path)];
}
