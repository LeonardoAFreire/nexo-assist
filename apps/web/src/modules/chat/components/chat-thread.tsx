import type { EmployeeConversationView } from '@nexo/contracts';
import { currentTurnError } from '../hooks/current-turn-error.js';
import type { TurnState } from '../hooks/turn-state.js';
import { useStickToBottom } from '../hooks/use-stick-to-bottom.js';
import { EmptyConversation } from './empty-conversation.js';
import { MessageList } from './message-list.js';
import { StreamingTurn } from './streaming-turn.js';
import { TurnAnnouncer } from './turn-announcer.js';
import { TurnError } from './turn-error.js';

type ChatThreadProps = {
  view: EmployeeConversationView;
  turn: TurnState;
  busy: boolean;
  onPick: (text: string) => void;
  onRetry: () => void;
};

export function ChatThread({ view, turn, busy, onPick, onRetry }: ChatThreadProps) {
  const error = currentTurnError(view.timeline, turn);
  const progress = `${view.timeline.length}:${turn.status}:${turn.text.length}:${turn.steps.length}`;
  const scrollRef = useStickToBottom<HTMLDivElement>(progress);
  const isEmpty = view.timeline.length === 0 && turn.status === 'idle';
  return (
    <div
      ref={scrollRef}
      className="min-h-0 flex-1 [scrollbar-gutter:stable] overflow-y-auto px-4 pt-7 pb-1 md:px-12 lg:px-32 xl:px-50"
    >
      <div className="mx-auto flex max-w-[808px] flex-col gap-5">
        {isEmpty ? <EmptyConversation disabled={busy} onPick={onPick} /> : null}
        <MessageList messages={view.timeline} />
        <StreamingTurn turn={turn} />
        {error ? <TurnError error={error} onRetry={onRetry} /> : null}
        <TurnAnnouncer timeline={view.timeline} />
      </div>
    </div>
  );
}
