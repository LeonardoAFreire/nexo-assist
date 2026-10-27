import { describe, expect, it } from 'vitest';
import { loginRequestSchema } from './login-request.js';

describe('loginRequestSchema', () => {
  it('aceita o exemplo da TechSpec e normaliza o e-mail para minúsculas', () => {
    const result = loginRequestSchema.parse({
      email: ' Ana.Souza@nexo.com.br ',
      password: 'qualquer',
    });
    expect(result).toEqual({
      email: 'ana.souza@nexo.com.br',
      password: 'qualquer',
      remember: false,
    });
  });

  it('aceita senha vazia para o caso de uso recusar com erro genérico', () => {
    expect(loginRequestSchema.safeParse({ email: 'ana@nexo.com.br', password: '' }).success).toBe(
      true,
    );
  });

  it('recusa e-mail inválido e campos extras', () => {
    expect(loginRequestSchema.safeParse({ email: 'ana', password: 'x' }).success).toBe(false);
    expect(
      loginRequestSchema.safeParse({ email: 'ana@nexo.com.br', password: 'x', role: 'analyst' })
        .success,
    ).toBe(false);
  });
});
