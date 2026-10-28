import type { ReactNode } from 'react';
import { useSmoothText } from '../hooks/use-smooth-text.js';
import { FormattedText } from './formatted-text.js';
import { TypingIndicator } from './typing-indicator.js';

type AgentBubbleProps = {
  text: string;
  busy: boolean;
  children?: ReactNode;
};

function StreamingCaret() {
  return (
    <span
      aria-hidden="true"
      className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[2px] rounded-full bg-cta/70 motion-safe:animate-pulse"
    />
  );
}

export function AgentBubble({ text, busy, children }: AgentBubbleProps) {
  const visible = useSmoothText(text);
  const typing = busy && text === '';
  const writing = visible !== '' && (busy || visible.length < text.length);
  if (!text && !typing && !children) {
    return null;
  }
  return (
    <div className="flex max-w-full flex-col gap-3 rounded-[4px_12px_12px_12px] border border-rule bg-paper px-4 py-3 text-[14.5px] break-words text-ink sm:max-w-[600px]">
      {text || typing ? (
        <div className="whitespace-pre-wrap">
          {typing ? <TypingIndicator /> : <FormattedText text={visible} />}
          {writing ? <StreamingCaret /> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}
