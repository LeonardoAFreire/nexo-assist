import type { ChatMessage } from '@nexo/contracts';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ConsoleMessage } from './console-message.js';
import { dayKeyOf, formatDayLabel } from './day-label.js';

type ConsoleThreadProps = {
  timeline: ChatMessage[];
};

function startsNewDay(timeline: ChatMessage[], index: number): boolean {
  const previous = timeline[index - 1];
  return !previous || dayKeyOf(previous.createdAt) !== dayKeyOf(timeline[index]!.createdAt);
}

function DayPill({ isoDate }: { isoDate: string }) {
  return (
    <p className="mx-auto mb-1 w-fit rounded-full bg-paper/80 px-2.5 py-1 text-xs font-medium text-ink-3">
      {formatDayLabel(isoDate)}
    </p>
  );
}

export function ConsoleThread({ timeline }: ConsoleThreadProps) {
  const [initialIds] = useState(() => new Set(timeline.map((message) => message.id)));
  return (
    <ol aria-label="Histórico da conversa" aria-live="polite" className="flex flex-col gap-4">
      {timeline.map((message: ChatMessage, index: number) => (
        <li
          key={message.id}
          className={cn(!initialIds.has(message.id) && 'motion-safe:animate-rise')}
        >
          {startsNewDay(timeline, index) ? <DayPill isoDate={message.createdAt} /> : null}
          <ConsoleMessage message={message} />
        </li>
      ))}
    </ol>
  );
}
