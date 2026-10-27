import { DEMO_ANALYSTS, DEMO_EMPLOYEES, DEMO_PEOPLE } from '@nexo/contracts';
import { describe, expect, it } from 'vitest';
import { IdentityService } from './identity.service.js';
import { InMemoryUserRepository } from './in-memory-user-repository.js';
import type { UserRecord } from './user-record.js';

const [ana, bruno] = DEMO_EMPLOYEES;
const [rafael] = DEMO_ANALYSTS;

const RECORDS: UserRecord[] = DEMO_PEOPLE.map((person) => ({ ...person, passwordHash: null }));

function makeService(): IdentityService {
  return new IdentityService(new InMemoryUserRepository(RECORDS));
}

describe('IdentityService', () => {
  it('devolve os perfis pedidos sem expor o e-mail', async () => {
    const profiles = await makeService().findProfiles({ userIds: [ana!.id, rafael!.id] });
    expect(profiles.map((profile) => profile.id)).toEqual([ana!.id, rafael!.id]);
    expect(profiles.every((profile) => !('email' in profile))).toBe(true);
  });

  it('ignora ids desconhecidos', async () => {
    const profiles = await makeService().findProfiles({ userIds: [bruno!.id, 'desconhecido'] });
    expect(profiles.map((profile) => profile.id)).toEqual([bruno!.id]);
  });

  it('devolve lista vazia sem ids', async () => {
    await expect(makeService().findProfiles({ userIds: [] })).resolves.toEqual([]);
  });

  it('monta o usuário da sessão com a expiração informada', async () => {
    const expiresAt = new Date('2026-01-01T08:00:00.000Z');
    const user = await makeService().findSessionUser({ userId: ana!.id, expiresAt });
    expect(user).toMatchObject({ id: ana!.id, email: ana!.email });
    expect(user?.session.expiresAt).toBe(expiresAt.toISOString());
  });

  it('devolve nulo para usuário inexistente', async () => {
    const found = await makeService().findSessionUser({
      userId: 'desconhecido',
      expiresAt: new Date(),
    });
    expect(found).toBeNull();
  });
});
