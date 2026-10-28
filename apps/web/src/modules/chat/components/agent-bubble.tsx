import type { ReactNode } from 'react';
import { FormattedText } from './formatted-text.js';
import { TypingIndicator } from './typing-indicator.js';

type AgentBubbleProps = {
  text: string;
  typing: boolean;
  children?: ReactNode;
};

export function AgentBubble({ text, typing, children }: AgentBubbleProps) {
  if (!text && !typing && !children) {
    return null;
  }

  return (
    <div className="flex max-w-full flex-col gap-3 rounded-[4px_12px_12px_12px] border border-rule bg-paper px-4 py-3 text-[14.5px] break-words text-ink sm:max-w-[600px]">
      {text || typing ? (
        <div className="whitespace-pre-wrap">
          {typing ? <TypingIndicator /> : <FormattedText text={text} />}
        </div>
      ) : null}
      {children}
    </div>
  );
}
