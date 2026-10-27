import { normalizePath, resolveConfig } from 'vite';
import { describe, expect, it } from 'vitest';

describe('configuração do Vite', () => {
  it('lê as variáveis VITE_* do .env da raiz do repositório', async () => {
    const { envDir, root } = await resolveConfig({}, 'serve');
    if (envDir === false) {
      throw new Error('envDir desativado na configuração do Vite');
    }
    expect(normalizePath(root)).toBe(`${normalizePath(envDir)}/apps/web`);
  });
});
