import type { AgentStep } from '@nexo/contracts';
import { cn } from '@/lib/utils';
import { formatAttempts, stepStatusLabel } from './labels.js';

type DecisionStepListProps = {
  steps: AgentStep[];
};

function DecisionStepItem({ step }: { step: AgentStep }) {
  const attempts = formatAttempts(step.attempts);
  const details = [stepStatusLabel(step), attempts].filter(Boolean).join(' · ');
  return (
    <li className="flex flex-col">
      <span className="font-medium text-ink">{step.label}</span>
      <span>{step.result}</span>
      <span className={cn('text-xs', step.status === 'failed' ? 'text-destructive' : 'text-ink-3')}>
        {details}
      </span>
    </li>
  );
}

export function DecisionStepList({ steps }: DecisionStepListProps) {
  return (
    <ol className="flex flex-col gap-2">
      {steps.map((step: AgentStep) => (
        <DecisionStepItem key={step.id} step={step} />
      ))}
    </ol>
  );
}
