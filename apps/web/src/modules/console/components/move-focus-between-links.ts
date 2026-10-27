import type { KeyboardEvent } from 'react';

const STEP_BY_KEY: Record<string, number> = { ArrowDown: 1, ArrowUp: -1 };

export function moveFocusBetweenLinks(event: KeyboardEvent<HTMLAnchorElement>): void {
  const step = STEP_BY_KEY[event.key];
  if (step === undefined) {
    return;
  }
  const links = Array.from(
    event.currentTarget.closest('ul')?.querySelectorAll<HTMLAnchorElement>('a') ?? [],
  );
  const currentIndex = links.findIndex((link) => link === document.activeElement);
  const target = links[currentIndex + step];
  if (currentIndex < 0 || !target) {
    return;
  }
  event.preventDefault();
  target.focus();
}
