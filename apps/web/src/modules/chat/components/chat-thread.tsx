import type { NexoUIMessage, TurnError as TurnErrorState } from '../types/nexo-ui-message.js';
import { persistedOf } from '../hooks/ui-messages.js';
import { useStickToBottom } from '../hooks/use-stick-to-bottom.js';
import { EmptyConversation } from './empty-conversation.js';
import { MessageList } from './message-list.js';
import { ScrollToLatest } from './scroll-to-latest.js';
import { TurnAnnouncer } from './turn-announcer.js';
import { TurnError } from './turn-error.js';

type ChatThreadProps = {
  messages: NexoUIMessage[];
  streamingId: string | null;
  busy: boolean;
  error: TurnErrorState | null;
  onPick: (text: string) => void;
  onRetry: () => void;
};

function scrollProgress(messages: NexoUIMessage[]): string {
  const last = messages.at(-1);
  const size = last?.parts.reduce((total, part) => total + JSON.stringify(part).length, 0) ?? 0;
  return `${messages.length}:${size}:${last?.metadata?.message?.id ?? ''}`;
}

export function ChatThread(props: ChatThreadProps) {
  const { messages, streamingId, busy, error, onPick, onRetry } = props;
  const lastUserId = messages.findLast((message) => message.role === 'user')?.id ?? null;
  const { ref, atBottom, onScroll, scrollToBottom } = useStickToBottom<HTMLDivElement>(
    scrollProgress(messages),
    lastUserId,
  );
  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        ref={ref}
        onScroll={onScroll}
        className="min-h-0 flex-1 md:[scrollbar-gutter:stable] overflow-y-auto px-4 pt-7 pb-1 md:px-12 lg:px-32 xl:px-50"
      >
        <div className="mx-auto flex max-w-[808px] flex-col gap-5">
          {messages.length === 0 ? <EmptyConversation disabled={busy} onPick={onPick} /> : null}
          <MessageList messages={messages} streamingId={streamingId} />
          {error ? <TurnError error={error} onRetry={onRetry} /> : null}
          <TurnAnnouncer timeline={persistedOf(messages)} />
        </div>
      </div>
      <ScrollToLatest visible={!atBottom} onClick={scrollToBottom} />
    </div>
  );
}
