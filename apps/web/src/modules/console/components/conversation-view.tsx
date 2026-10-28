import type { ConsoleConversationDetail } from '@nexo/contracts';
import { useAttendance } from '../hooks/use-attendance.js';
import { useScrollToEnd } from '../hooks/use-scroll-to-end.js';
import { AnalystComposer } from './analyst-composer.js';
import { attendanceModeOf } from './attendance-mode.js';
import { ConsoleThread } from './console-thread.js';
import { ConversationHeader } from './conversation-header.js';
import { HandoffSummary } from './handoff-summary.js';
import { TakeoverBar } from './takeover-bar.js';

type ConversationViewProps = {
  detail: ConsoleConversationDetail;
  analystId: string;
};

export function ConversationView({ detail, analystId }: ConversationViewProps) {
  const { conversation, timeline } = detail;
  const attendance = useAttendance(conversation.id);
  const scrollRef = useScrollToEnd<HTMLDivElement>(timeline.length);
  const mode = attendanceModeOf(conversation, analystId);
  return (
    <>
      <ConversationHeader
        conversation={conversation}
        analystId={analystId}
        attendance={attendance}
      />
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-10 pt-5 pb-4">
        <div className="flex min-h-full flex-col justify-end gap-4">
          {conversation.handoff ? <HandoffSummary handoff={conversation.handoff} /> : null}
          <ConsoleThread timeline={timeline} />
        </div>
      </div>
      {mode === 'mine' ? <AnalystComposer conversationId={conversation.id} /> : null}
      {mode === 'claimable' ? (
        <TakeoverBar conversation={conversation} attendance={attendance} />
      ) : null}
    </>
  );
}
