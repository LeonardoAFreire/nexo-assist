import type { ChatMessage } from '@nexo/contracts';
import { ArrowRightLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConsoleBubble } from './console-bubble.js';
import { ConsoleSender } from './console-sender.js';
import { MessageParts } from './message-parts.js';

const AGENT_NAME = 'Nexo Assist';
const AGENT_TAG = 'IA';
const AGENT_TAG_CLASS = 'bg-primary-soft text-primary-text';
const ANALYST_TAG_CLASS = 'bg-success-soft text-success-text';
const EMPLOYEE_FALLBACK_NAME = 'Funcionário';
const FALLBACK_ANALYST_TAG = 'Suporte';

type ConsoleMessageProps = {
  message: ChatMessage;
};

function SystemMessage({ message }: ConsoleMessageProps) {
  return (
    <div className="flex items-center gap-3 pt-[18px] pb-1">
      <span aria-hidden="true" className="h-px flex-1 bg-ink/8" />
      <p className="flex items-center gap-1.5 text-xs font-medium text-ink-3">
        <ArrowRightLeft aria-hidden="true" className="size-[13px]" />
        {message.text}
      </p>
      <span aria-hidden="true" className="h-px flex-1 bg-ink/8" />
    </div>
  );
}

function ClientMessage({ message }: ConsoleMessageProps) {
  return (
    <div className="flex flex-col items-start gap-1">
      <ConsoleBubble side="client" createdAt={message.createdAt}>
        {message.text}
      </ConsoleBubble>
      <MessageParts parts={message.parts} />
    </div>
  );
}

function StaffMessage({ message }: ConsoleMessageProps) {
  const fromAnalyst = message.author === 'analyst';
  const name = fromAnalyst ? (message.authorName ?? EMPLOYEE_FALLBACK_NAME) : AGENT_NAME;
  const analystTag = message.authorLevel ? `Suporte ${message.authorLevel}` : FALLBACK_ANALYST_TAG;
  return (
    <div className={cn('flex flex-col items-end gap-1')}>
      <ConsoleSender
        name={name}
        tag={fromAnalyst ? analystTag : AGENT_TAG}
        tagClass={fromAnalyst ? ANALYST_TAG_CLASS : AGENT_TAG_CLASS}
        steps={message.turn?.steps}
        decision={message.turn?.decision}
      />
      <ConsoleBubble side={fromAnalyst ? 'analyst' : 'agent'} createdAt={message.createdAt}>
        {message.text}
      </ConsoleBubble>
      <MessageParts parts={message.parts} />
    </div>
  );
}

export function ConsoleMessage({ message }: ConsoleMessageProps) {
  if (message.author === 'system') {
    return <SystemMessage message={message} />;
  }
  return message.author === 'employee' ? (
    <ClientMessage message={message} />
  ) : (
    <StaffMessage message={message} />
  );
}
