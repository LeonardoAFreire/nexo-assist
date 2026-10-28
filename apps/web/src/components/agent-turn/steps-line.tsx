import type { AgentStep } from '@nexo/contracts';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatAttempts, STEP_FAILED_LABEL } from './labels.js';

type StepsLineProps = {
  steps: AgentStep[];
  live?: boolean;
};

type StepItemProps = {
  step: AgentStep;
  live: boolean;
};

function StepItem({ step, live }: StepItemProps) {
  const failed = step.status === 'failed';
  const attempts = formatAttempts(step.attempts);
  return (
    <li
      className={cn(
        'flex items-center gap-[5px]',
        failed && 'text-destructive',
        live && 'motion-safe:animate-rise',
      )}
    >
      <Check aria-hidden="true" className="size-3" />
      <span>
        {step.label}
        {failed ? ` (${STEP_FAILED_LABEL})` : ''}
        {attempts ? ` (${attempts})` : ''}
      </span>
    </li>
  );
}

export function StepsLine({ steps, live = false }: StepsLineProps) {
  if (steps.length === 0) {
    return null;
  }

  return (
    <ul
      aria-label="Passos do agent"
      className="flex flex-wrap gap-x-3 gap-y-1 text-[12.5px] text-ink-3"
    >
      {steps.map((step: AgentStep) => (
        <StepItem key={step.id} step={step} live={live} />
      ))}
    </ul>
  );
}
