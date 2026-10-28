import { useEffect, useState } from 'react';

const CATCH_UP_FRAMES = 45;
const MIN_CHARS_PER_FRAME = 2;
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function prefersInstantText(): boolean {
  if (typeof window.matchMedia !== 'function') {
    return true;
  }
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function nextLength(current: number, target: number): number {
  const step = Math.max(MIN_CHARS_PER_FRAME, Math.ceil((target - current) / CATCH_UP_FRAMES));
  return Math.min(target, current + step);
}

export function useSmoothText(text: string): string {
  const [instant] = useState(prefersInstantText);
  const [shown, setShown] = useState(text.length);
  const target = text.length;
  useEffect(() => {
    if (instant || shown >= target) {
      return;
    }
    const frame = requestAnimationFrame(() => setShown((current) => nextLength(current, target)));
    return () => cancelAnimationFrame(frame);
  }, [instant, shown, target]);
  return instant ? text : text.slice(0, Math.min(shown, target));
}
