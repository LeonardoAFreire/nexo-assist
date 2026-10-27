import type { ChatMessage } from '@nexo/contracts';
import { MessageParts } from './message-parts.js';

const ANALYST_FALLBACK_NAME = 'Analista';

type AnalystMessageProps = {
  message: ChatMessage;
};

function analystLabel(message: ChatMessage): string {
  const name = message.authorName ?? ANALYST_FALLBACK_NAME;
  return message.authorLevel ? `${name} · Suporte ${message.authorLevel}` : name;
}

export function AnalystMessage({ message }: AnalystMessageProps) {
  const label = analystLabel(message);
  return (
    <article aria-label={label} className="flex flex-col gap-1.5">
      <span className="text-[12.5px] font-semibold text-ink">{label}</span>
      <div className="max-w-full rounded-[4px_12px_12px_12px] border border-primary/25 bg-primary-soft px-4 py-3 text-[14.5px] break-words whitespace-pre-wrap text-ink sm:max-w-[600px]">
        {message.text}
      </div>
      <MessageParts messageId={message.id} parts={message.parts} />
    </article>
  );
}
