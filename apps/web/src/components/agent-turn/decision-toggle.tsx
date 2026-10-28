import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const TOGGLE_LABEL = 'Ver detalhes da decisão';

type DecisionToggleProps = {
  expanded: boolean;
  controls: string;
  onToggle: () => void;
};

export function DecisionToggle({ expanded, controls, onToggle }: DecisionToggleProps) {
  return (
    <button
      type="button"
      aria-label={TOGGLE_LABEL}
      title={TOGGLE_LABEL}
      aria-expanded={expanded}
      aria-controls={controls}
      onClick={onToggle}
      className="flex size-5 items-center justify-center rounded-md text-ink-3 outline-none hover:bg-desk hover:text-primary-text focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <ChevronDown aria-hidden="true" className={cn('size-3.5', expanded && 'rotate-180')} />
    </button>
  );
}
