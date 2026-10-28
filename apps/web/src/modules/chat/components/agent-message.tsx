import type { AgentDecision, AgentStep, MessagePart } from '@nexo/contracts';
import { DecisionDetails } from '@/components/agent-turn/decision-details';
import { StepsLine } from '@/components/agent-turn/steps-line';
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
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-[12.5px] font-semibold text-ink">Nexo Assist</span>
        <StepsLine steps={steps} />
      </div>
      {options.length === 0 ? bubble : null}
      <MessageParts messageId={messageId} parts={others} />
      {options.length > 0 ? bubble : null}
      {decision ? <DecisionDetails decision={decision} steps={steps} /> : null}
    </article>
  );
}
