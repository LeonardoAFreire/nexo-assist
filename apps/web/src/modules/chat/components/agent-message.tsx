import type { AgentDecision, AgentStep, MessagePart } from '@nexo/contracts';
import { DecisionDetails } from '@/components/agent-turn/decision-details';
import { StepsLine } from '@/components/agent-turn/steps-line';
import { AgentBubble } from './agent-bubble.js';
import { MessageParts } from './message-parts.js';

type AgentMessageProps = {
  text: string;
  steps: AgentStep[];
  parts: MessagePart[];
  decision: AgentDecision | null;
  busy: boolean;
};

export function AgentMessage({ text, steps, parts, decision, busy }: AgentMessageProps) {
  return (
    <article aria-label="Nexo Assist" aria-busy={busy} className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-[12.5px] font-semibold text-ink">Nexo Assist</span>
        <StepsLine steps={steps} />
      </div>
      <AgentBubble text={text} typing={busy && text === ''} />
      <MessageParts parts={parts} />
      {decision ? <DecisionDetails decision={decision} steps={steps} /> : null}
    </article>
  );
}
