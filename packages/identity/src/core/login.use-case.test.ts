import { DEMO_PEOPLE } from '@nexo/contracts';
import { describe, expect, it } from 'vitest';
import { InMemoryUserRepository } from './in-memory-user-repository.js';
import { InvalidCredentialsError } from './invalid-credentials.error.js';
import { LoginUseCase, type SessionIssuer } from './login.use-case.js';
import type { PasswordHasher } from './password-hasher.js';
import { PasswordPolicy } from './password-policy.js';
import type { UserRecord } from './user-record.js';

const SESSION_EXPIRATION = new Date('2026-01-01T08:00:00.000Z');
const ANA_EMAIL = 'ana.souza@nexo.com.br';
const DEFAULT_PASSWORD = 'senha-de-teste';

const fakeHasher: PasswordHasher = {
  hash: async (plain) => `hash:${plain}`,
  verify: async (plain, hash) => hash === `hash:${plain}`,
};

type MakeUseCaseOptions = { enforced: boolean; storedHash: string | null };

function makeUseCase(options: MakeUseCaseOptions = { enforced: false, storedHash: null }): {
  useCase: LoginUseCase;
  issued: { remember: boolean }[];
} {
  const issued: { remember: boolean }[] = [];
  const sessions: SessionIssuer = {
    issue: async (input) => {
      issued.push({ remember: input.remember });
      return { token: `token-${input.userId}`, claims: { expiresAt: SESSION_EXPIRATION } };
    },
  };
  const records: UserRecord[] = DEMO_PEOPLE.map((person) => ({
    ...person,
    passwordHash: options.storedHash,
  }));
  const policy = new PasswordPolicy(fakeHasher, options.enforced);
  const useCase = new LoginUseCase(new InMemoryUserRepository(records), sessions, policy);
  return { useCase, issued };
}

describe('LoginUseCase', () => {
  it('cria a sessão para e-mail conhecido em qualquer caixa', async () => {
    const { useCase } = makeUseCase();
    const result = await useCase.execute({
      email: '  Ana.Souza@NEXO.com.br ',
      password: 'qualquer',
      remember: false,
    });
    expect(result.user).toMatchObject({
      email: ANA_EMAIL,
      role: 'employee',
      department: 'Financeiro',
      initials: 'AS',
    });
    expect(result.user.session.expiresAt).toBe(SESSION_EXPIRATION.toISOString());
    expect(result.token).toBe(`token-${result.user.id}`);
  });

  it('entrega o papel de analista e o nível de suporte dos dados de exemplo', async () => {
    const { useCase } = makeUseCase();
    const result = await useCase.execute({
      email: 'rafael.lima@nexo.com.br',
      password: 'x',
      remember: false,
    });
    expect(result.user).toMatchObject({ role: 'analyst', supportLevel: 'N2', department: null });
  });

  it('repassa a opção de lembrar ao emissor da sessão', async () => {
    const { useCase, issued } = makeUseCase();
    await useCase.execute({ email: ANA_EMAIL, password: 'x', remember: true });
    expect(issued).toEqual([{ remember: true }]);
  });

  it('recusa e-mail desconhecido e senha vazia com o mesmo erro genérico', async () => {
    const { useCase, issued } = makeUseCase();
    const unknownEmail = useCase.execute({
      email: 'ninguem@nexo.com.br',
      password: 'x',
      remember: false,
    });
    const emptyPassword = useCase.execute({ email: ANA_EMAIL, password: '', remember: false });
    const unknownError = await unknownEmail.catch((error: unknown) => error);
    const emptyError = await emptyPassword.catch((error: unknown) => error);
    expect(unknownError).toBeInstanceOf(InvalidCredentialsError);
    expect(emptyError).toBeInstanceOf(InvalidCredentialsError);
    expect((unknownError as Error).message).toBe((emptyError as Error).message);
    expect(issued).toEqual([]);
  });

  describe('com a senha padrão exigida (produção)', () => {
    const enforced = { enforced: true, storedHash: `hash:${DEFAULT_PASSWORD}` };

    it('entra com a senha padrão', async () => {
      const { useCase } = makeUseCase(enforced);
      const result = await useCase.execute({
        email: ANA_EMAIL,
        password: DEFAULT_PASSWORD,
        remember: false,
      });
      expect(result.user.email).toBe(ANA_EMAIL);
    });

    it('recusa outra senha com o mesmo erro genérico e sem emitir sessão', async () => {
      const { useCase, issued } = makeUseCase(enforced);
      const wrong = useCase.execute({ email: ANA_EMAIL, password: 'qualquer', remember: false });
      await expect(wrong).rejects.toBeInstanceOf(InvalidCredentialsError);
      expect(issued).toEqual([]);
    });

    it('recusa quem não tem senha cadastrada', async () => {
      const { useCase } = makeUseCase({ enforced: true, storedHash: null });
      const attempt = useCase.execute({
        email: ANA_EMAIL,
        password: DEFAULT_PASSWORD,
        remember: false,
      });
      await expect(attempt).rejects.toBeInstanceOf(InvalidCredentialsError);
    });
  });
});
