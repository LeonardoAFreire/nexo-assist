import { TypingIndicator } from './typing-indicator.js';

type AgentBubbleProps = {
  text: string;
  typing: boolean;
};

export function AgentBubble({ text, typing }: AgentBubbleProps) {
  if (!text && !typing) {
    return null;
  }

  return (
    <div className="max-w-full rounded-[4px_12px_12px_12px] border border-rule bg-paper px-4 py-3 text-[14.5px] break-words whitespace-pre-wrap text-ink sm:max-w-[600px]">
      {typing ? <TypingIndicator /> : text}
    </div>
  );
}
