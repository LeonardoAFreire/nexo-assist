import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { NexoUIMessage } from '../types/nexo-ui-message.js';
import { LiveMessage } from './live-message.js';
import { PersistedMessage } from './persisted-message.js';

type MessageListProps = {
  messages: NexoUIMessage[];
  streamingId: string | null;
};

const ENTER_ANIMATION =
  'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300 motion-safe:ease-out';

function isRenderable(message: NexoUIMessage, streamingId: string | null): boolean {
  const persisted = message.metadata?.message;
  if (persisted !== undefined) {
    return persisted.status === 'complete';
  }
  if (message.metadata?.failure !== undefined) {
    return false;
  }
  return message.role === 'user' || message.parts.length > 0 || message.id === streamingId;
}

function MessageItem({
  message,
  streamingId,
}: {
  message: NexoUIMessage;
  streamingId: string | null;
}) {
  const persisted = message.metadata?.message;
  if (persisted !== undefined) {
    return <PersistedMessage message={persisted} />;
  }
  return <LiveMessage message={message} streaming={message.id === streamingId} />;
}

export function MessageList({ messages, streamingId }: MessageListProps) {
  const [initialIds] = useState(() => new Set(messages.map((message) => message.id)));
  const visible = messages.filter((message) => isRenderable(message, streamingId));
  return (
    <ol aria-label="Mensagens" className="flex flex-col gap-5">
      {visible.map((message: NexoUIMessage) => (
        <li key={message.id} className={cn(!initialIds.has(message.id) && ENTER_ANIMATION)}>
          <MessageItem message={message} streamingId={streamingId} />
        </li>
      ))}
    </ol>
  );
}
