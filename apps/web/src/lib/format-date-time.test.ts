import { describe, expect, it } from 'vitest';
import { formatDate, formatDateTime } from './format-date-time.js';

describe('formatDateTime', () => {
  it('formata em pt-BR no fuso de São Paulo', () => {
    expect(formatDateTime('2026-10-14T13:20:00.000Z')).toMatch(/^14\/10\/2026,? 10:20$/);
  });

  it('usa o dia de São Paulo quando em UTC o dia já virou', () => {
    expect(formatDateTime('2026-10-15T01:30:00.000Z')).toMatch(/^14\/10\/2026,? 22:30$/);
  });
});

describe('formatDate', () => {
  it('formata só a data em pt-BR', () => {
    expect(formatDate('2026-10-20T13:20:00.000Z')).toBe('20/10/2026');
  });
});
