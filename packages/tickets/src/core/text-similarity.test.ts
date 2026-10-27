import { describe, expect, it } from 'vitest';
import { areTextsSimilar, normalizeText, significantTokens } from './text-similarity.js';

describe('text-similarity', () => {
  it('remove acentos e diferença de maiúsculas', () => {
    expect(normalizeText('Conexão À REDE')).toBe('conexao a rede');
  });

  it('ignora palavras curtas e comuns', () => {
    expect([...significantTokens('Eu não consigo abrir o Outlook')]).toEqual(['abrir', 'outlook']);
  });

  it('considera semelhantes textos que compartilham dois termos relevantes', () => {
    expect(areTextsSimilar('VPN não conecta', 'Erro de conexão: a VPN não conecta')).toBe(true);
  });

  it('não considera semelhantes textos que compartilham só um termo', () => {
    expect(areTextsSimilar('VPN não conecta', 'VPN lenta')).toBe(false);
  });
});
