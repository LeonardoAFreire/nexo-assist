import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const MIN_TEXT_CONTRAST = 4.5;
const RGB_CHANNELS = 3;
const HEX_PATTERN = /--([a-z0-9-]+):\s*(#[0-9a-f]{6})\b/g;
const CHANNEL_THRESHOLD = 0.03928;

function readTokens(): Map<string, string> {
  const css = readFileSync(path.resolve(import.meta.dirname, '../index.css'), 'utf8');
  return new Map([...css.matchAll(HEX_PATTERN)].map((match) => [match[1] ?? '', match[2] ?? '']));
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].slice(0, RGB_CHANNELS).map((start) => {
    const value = Number.parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= CHANNEL_THRESHOLD ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * (channels[0] ?? 0) + 0.7152 * (channels[1] ?? 0) + 0.0722 * (channels[2] ?? 0);
}

function contrast(first: string, second: string): number {
  const [lighter, darker] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return ((lighter ?? 0) + 0.05) / ((darker ?? 0) + 0.05);
}

describe('tema', () => {
  it('WCAG AA: todo token de texto *-text tem contraste mínimo de 4,5:1 sobre o fundo', () => {
    const tokens = readTokens();
    const paper = tokens.get('paper') ?? '#ffffff';
    const textTokens = [...tokens].filter(([name]) => name.endsWith('-text'));
    expect(textTokens.map(([name]) => name)).toContain('warning-text');
    for (const [name, value] of textTokens) {
      expect(contrast(value, paper), name).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
    }
  });
});
