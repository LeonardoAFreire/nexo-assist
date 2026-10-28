import type { AgentDecision, AgentStep } from '@nexo/contracts';
import { useId, useState } from 'react';
import { DecisionBody } from './decision-body.js';
import { DecisionToggle } from './decision-toggle.js';
import { StepsLine } from './steps-line.js';

type AgentTurnHeaderProps = {
  steps: AgentStep[];
  decision: AgentDecision | null;
  live?: boolean;
};

export function AgentTurnHeader({ steps, decision, live = false }: AgentTurnHeaderProps) {
  const [expanded, setExpanded] = useState(false);
  const bodyId = useId();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-[12.5px] font-semibold text-ink">Nexo Assist</span>
        <StepsLine steps={steps} live={live} />
        {decision ? (
          <DecisionToggle
            expanded={expanded}
            controls={bodyId}
            onToggle={() => setExpanded((current) => !current)}
          />
        ) : null}
      </div>
      {decision && expanded ? <DecisionBody id={bodyId} decision={decision} steps={steps} /> : null}
    </div>
  );
}
