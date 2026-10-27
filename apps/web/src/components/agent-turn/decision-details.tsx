import type { AgentDecision, AgentStep } from '@nexo/contracts';
import { ChevronDown } from 'lucide-react';
import { useId, useState } from 'react';
import { cn } from '@/lib/utils';
import { DecisionBody } from './decision-body.js';

type DecisionDetailsProps = {
  decision: AgentDecision;
  steps: AgentStep[];
};

export function DecisionDetails({ decision, steps }: DecisionDetailsProps) {
  const [expanded, setExpanded] = useState(false);
  const bodyId = useId();
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={bodyId}
        onClick={() => setExpanded((current) => !current)}
        className="flex w-fit items-center gap-1 rounded-md text-xs font-medium text-primary-text outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        Ver detalhes da decisão
        <ChevronDown aria-hidden="true" className={cn('size-3.5', expanded && 'rotate-180')} />
      </button>
      {expanded ? <DecisionBody id={bodyId} decision={decision} steps={steps} /> : null}
    </div>
  );
}
