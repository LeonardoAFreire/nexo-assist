import { describe, expect, it } from 'vitest';
import { buildSearchQuery, removeAccents } from './search-text.js';

describe('removeAccents', () => {
  it('remove acentos e cedilha mantendo as letras', () => {
    expect(removeAccents('horário de atenção')).toBe('horario de atencao');
  });
});

describe('buildSearchQuery', () => {
  it('normaliza acentos, caixa e pontuação e liga os termos com or', () => {
    expect(buildSearchQuery('Qual o Horário do service desk?')).toBe(
      'qual or o or horario or do or service or desk',
    );
  });

  it('descarta termos repetidos e o próprio operador or', () => {
    expect(buildSearchQuery('vpn OR vpn erro')).toBe('vpn or erro');
  });

  it('devolve texto vazio quando não há termos pesquisáveis', () => {
    expect(buildSearchQuery(' ?! - ')).toBe('');
  });
});
