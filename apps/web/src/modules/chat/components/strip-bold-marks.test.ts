import { describe, expect, it } from 'vitest';
import { stripBoldMarks } from './strip-bold-marks.js';

describe('stripBoldMarks', () => {
  it('remove os asteriscos do negrito e mantém o texto', () => {
    expect(stripBoldMarks('Está **aguardando analista** e **vencido**.')).toBe(
      'Está aguardando analista e vencido.',
    );
  });

  it('mantém asteriscos soltos', () => {
    expect(stripBoldMarks('2 * 3 e ** solto')).toBe('2 * 3 e ** solto');
  });
});
