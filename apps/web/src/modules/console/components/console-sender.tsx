import type { AgentDecision, AgentStep } from '@nexo/contracts';
import { useId, useState } from 'react';
import { DecisionBody } from '@/components/agent-turn/decision-body';
import { DecisionToggle } from '@/components/agent-turn/decision-toggle';
import { cn } from '@/lib/utils';

type ConsoleSenderProps = {
  name: string;
  tag: string;
  tagClass: string;
  steps?: AgentStep[];
  decision?: AgentDecision | null;
};

export function ConsoleSender({
  name,
  tag,
  tagClass,
  steps = [],
  decision = null,
}: ConsoleSenderProps) {
  const [expanded, setExpanded] = useState(false);
  const bodyId = useId();
  return (
    <div className="flex max-w-[420px] flex-col items-end gap-2">
      <p className="flex items-center gap-1.5 px-1 text-xs">
        <span className="font-semibold text-ink-2">{name}</span>
        <span className={cn('rounded-md px-1.5 py-px text-[11px] font-semibold', tagClass)}>
          {tag}
        </span>
        {decision ? (
          <DecisionToggle
            expanded={expanded}
            controls={bodyId}
            onToggle={() => setExpanded((current) => !current)}
          />
        ) : null}
      </p>
      {decision && expanded ? <DecisionBody id={bodyId} decision={decision} steps={steps} /> : null}
    </div>
  );
}
