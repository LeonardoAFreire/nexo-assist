import type { ChatMessage, EventPart, MessagePart } from '@nexo/contracts';

type SystemEventProps = {
  message: ChatMessage;
};

function eventLabels(parts: MessagePart[]): string[] {
  return parts
    .filter((part: MessagePart): part is EventPart => part.type === 'event')
    .map((part: EventPart) => part.label);
}

export function SystemEvent({ message }: SystemEventProps) {
  const labels = message.text ? [message.text] : eventLabels(message.parts);
  return (
    <div className="flex flex-col items-center gap-1 py-1">
      {labels.map((label: string) => (
        <p key={label} className="text-center text-xs font-medium text-ink-3">
          {label}
        </p>
      ))}
    </div>
  );
}
