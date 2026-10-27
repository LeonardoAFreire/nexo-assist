import type { ConsoleConversationDetail } from '@nexo/contracts';
import { useScrollToEnd } from '../hooks/use-scroll-to-end.js';
import { AnalystComposer } from './analyst-composer.js';
import { attendanceModeOf } from './attendance-mode.js';
import { ConsoleThread } from './console-thread.js';
import { ConversationHeader } from './conversation-header.js';
import { HandoffSummary } from './handoff-summary.js';

const CLAIM_HINT = 'Assuma o atendimento para responder ao funcionário.';

type ConversationViewProps = {
  detail: ConsoleConversationDetail;
  analystId: string;
};

export function ConversationView({ detail, analystId }: ConversationViewProps) {
  const { conversation, timeline } = detail;
  const scrollRef = useScrollToEnd<HTMLDivElement>(timeline.length);
  const mode = attendanceModeOf(conversation, analystId);
  return (
    <>
      <ConversationHeader conversation={conversation} analystId={analystId} />
      <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
        {conversation.handoff ? <HandoffSummary handoff={conversation.handoff} /> : null}
        <ConsoleThread timeline={timeline} />
      </div>
      {mode === 'mine' ? <AnalystComposer conversationId={conversation.id} /> : null}
      {mode === 'claimable' ? (
        <p className="border-t border-rule px-6 py-4 text-[13px] text-ink-3">{CLAIM_HINT}</p>
      ) : null}
    </>
  );
}
