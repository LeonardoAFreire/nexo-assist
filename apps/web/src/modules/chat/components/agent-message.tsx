import type { AgentDecision, AgentStep, MessagePart } from '@nexo/contracts';
import { AgentTurnHeader } from '@/components/agent-turn/agent-turn-header';
import { AgentBubble } from './agent-bubble.js';
import { MessageParts } from './message-parts.js';

type AgentMessageProps = {
  messageId: string | null;
  text: string;
  steps: AgentStep[];
  parts: MessagePart[];
  decision: AgentDecision | null;
  busy: boolean;
};

function isQuickOptions(part: MessagePart): boolean {
  return part.type === 'quick_options';
}

export function AgentMessage(props: AgentMessageProps) {
  const { messageId, text, steps, parts, decision, busy } = props;
  const options = parts.filter(isQuickOptions);
  const others = parts.filter((part: MessagePart) => !isQuickOptions(part));
  const bubble = (
    <AgentBubble text={text} typing={busy && text === ''}>
      <MessageParts messageId={messageId} parts={options} />
    </AgentBubble>
  );
  return (
    <article aria-label="Nexo Assist" aria-busy={busy} className="flex flex-col gap-1.5">
      <AgentTurnHeader steps={steps} decision={decision} />
      {options.length === 0 ? bubble : null}
      <MessageParts messageId={messageId} parts={others} />
      {options.length > 0 ? bubble : null}
    </article>
  );
}
