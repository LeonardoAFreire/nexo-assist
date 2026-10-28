import { CheckCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { formatClockTime } from './format-clock-time.js';

type BubbleSide = 'client' | 'agent' | 'analyst';

type ConsoleBubbleProps = {
  side: BubbleSide;
  createdAt: string;
  children: ReactNode;
};

const SIDE_CLASS: Record<BubbleSide, string> = {
  client: 'rounded-[4px_12px_12px_12px] bg-paper',
  agent: 'rounded-[12px_4px_12px_12px] bg-[#e6effa]',
  analyst: 'rounded-[12px_4px_12px_12px] bg-[#e3f4ea]',
};

export function ConsoleBubble({ side, createdAt, children }: ConsoleBubbleProps) {
  return (
    <div
      className={cn(
        'flex max-w-[420px] items-end gap-2.5 px-3 pt-2 pb-1.5 shadow-[0_1px_2px_#1b243112]',
        SIDE_CLASS[side],
      )}
    >
      <p className="min-w-0 text-[14.5px] leading-[1.45] break-words whitespace-pre-wrap text-ink">
        {children}
      </p>
      <span className="flex shrink-0 items-center gap-[3px] pb-px text-[11px] text-ink-3">
        <time dateTime={createdAt}>{formatClockTime(createdAt)}</time>
        {side === 'client' ? null : (
          <CheckCheck aria-hidden="true" className="size-3.5 text-primary" />
        )}
      </span>
    </div>
  );
}
