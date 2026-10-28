import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSmoothText } from './use-smooth-text.js';

const FRAME_MS = 16;
const REPLY = 'Encontrei um artigo da central que resolve o erro 809 no Windows 10.';

function advanceFrames(count: number): void {
  for (let frame = 0; frame < count; frame++) {
    act(() => {
      vi.advanceTimersByTime(FRAME_MS);
    });
  }
}

function stubMotionPreference(reduced: boolean): void {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: reduced, media: query }));
}

describe('useSmoothText', () => {
  beforeEach(() => vi.useFakeTimers());

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('revela a resposta aos poucos e alcança o texto inteiro', () => {
    stubMotionPreference(false);
    const { result, rerender } = renderHook(({ text }) => useSmoothText(text), {
      initialProps: { text: '' },
    });
    rerender({ text: REPLY });
    advanceFrames(3);
    expect(result.current.length).toBeGreaterThan(0);
    expect(result.current.length).toBeLessThan(REPLY.length);
    expect(REPLY.startsWith(result.current)).toBe(true);
    advanceFrames(120);
    expect(result.current).toBe(REPLY);
  });

  it('mostra na hora o histórico já carregado', () => {
    stubMotionPreference(false);
    const { result } = renderHook(() => useSmoothText(REPLY));
    expect(result.current).toBe(REPLY);
  });

  it('mostra o texto inteiro de imediato quando o sistema pede menos movimento', () => {
    stubMotionPreference(true);
    const { result, rerender } = renderHook(({ text }) => useSmoothText(text), {
      initialProps: { text: '' },
    });
    rerender({ text: REPLY });
    expect(result.current).toBe(REPLY);
  });
});
