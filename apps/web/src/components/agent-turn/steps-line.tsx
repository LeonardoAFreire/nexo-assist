import type { AgentStep } from '@nexo/contracts';
import { cn } from '@/lib/utils';
import { formatAttempts, STEP_FAILED_LABEL } from './labels.js';

type StepsLineProps = {
  steps: AgentStep[];
};

function StepItem({ step }: { step: AgentStep }) {
  const failed = step.status === 'failed';
  const attempts = formatAttempts(step.attempts);
  return (
    <li
      className={cn(
        'not-first:before:mr-1.5 not-first:before:content-["·"]',
        failed && 'text-destructive',
      )}
    >
      {step.label}
      {failed ? ` (${STEP_FAILED_LABEL})` : ''}
      {attempts ? ` (${attempts})` : ''}
    </li>
  );
}

export function StepsLine({ steps }: StepsLineProps) {
  if (steps.length === 0) {
    return null;
  }

  return (
    <ul aria-label="Passos do agent" className="flex flex-wrap gap-x-1.5 text-xs text-ink-3">
      {steps.map((step: AgentStep) => (
        <StepItem key={step.id} step={step} />
      ))}
    </ul>
  );
}
