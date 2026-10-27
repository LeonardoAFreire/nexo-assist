import type { ChatMessage } from '@nexo/contracts';
import { DecisionDetails } from '@/components/agent-turn/decision-details';
import { StepsLine } from '@/components/agent-turn/steps-line';
import { cn } from '@/lib/utils';
import { formatClockTime } from './format-clock-time.js';
import { MessageParts } from './message-parts.js';

const AGENT_NAME = 'Nexo Assist';
const EMPLOYEE_FALLBACK_NAME = 'Funcionário';

type ConsoleMessageProps = {
  message: ChatMessage;
};

function authorLabel(message: ChatMessage): string {
  if (message.author === 'agent') {
    return AGENT_NAME;
  }
  const name = message.authorName ?? EMPLOYEE_FALLBACK_NAME;
  return message.authorLevel ? `${name} · Suporte ${message.authorLevel}` : name;
}

function MessageHeader({ message }: ConsoleMessageProps) {
  return (
    <p className="flex items-center gap-1.5 text-xs text-ink-3">
      <span className="font-semibold text-ink-2">{authorLabel(message)}</span>
      {message.author === 'agent' ? <span className="rounded bg-desk px-1.5">IA</span> : null}
      <time dateTime={message.createdAt}>{formatClockTime(message.createdAt)}</time>
    </p>
  );
}

function SystemMessage({ message }: ConsoleMessageProps) {
  return <p className="py-1 text-center text-xs font-medium text-ink-3">{message.text}</p>;
}

export function ConsoleMessage({ message }: ConsoleMessageProps) {
  if (message.author === 'system') {
    return <SystemMessage message={message} />;
  }
  const fromAnalyst = message.author === 'analyst';
  const bubbleClass = fromAnalyst ? 'bg-primary-soft' : 'bg-desk';
  return (
    <div className={cn('flex flex-col gap-1.5', fromAnalyst ? 'items-end' : 'items-start')}>
      <MessageHeader message={message} />
      <p className={cn('max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm text-ink', bubbleClass)}>
        {message.text}
      </p>
      <MessageParts parts={message.parts} />
      {message.turn ? <StepsLine steps={message.turn.steps} /> : null}
      {message.turn ? (
        <DecisionDetails decision={message.turn.decision} steps={message.turn.steps} />
      ) : null}
    </div>
  );
}
