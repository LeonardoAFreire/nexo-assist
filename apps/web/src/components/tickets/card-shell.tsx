import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export const CARD_SURFACE_CLASS =
  'overflow-hidden rounded-2xl border border-ink/9 bg-paper shadow-[0_1px_2px_#1b24310d,0_6px_18px_#1b24310a]';

type CardShellProps = {
  label?: string;
  labelledBy?: string;
  busy?: boolean;
  children: ReactNode;
};

export function CardShell({ label, labelledBy, busy, children }: CardShellProps) {
  return (
    <article
      aria-label={label}
      aria-labelledby={labelledBy}
      aria-busy={busy}
      className={cn('w-full', CARD_SURFACE_CLASS)}
    >
      {children}
    </article>
  );
}
