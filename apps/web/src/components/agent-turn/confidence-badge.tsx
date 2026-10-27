import type { DecisionConfidence } from '@nexo/contracts';
import { cn } from '@/lib/utils';
import { formatConfidence } from './labels.js';

const confidenceStyles: Record<DecisionConfidence['label'], string> = {
  alta: 'bg-success-soft text-success-text',
  média: 'bg-warning/15 text-ink-2',
  baixa: 'bg-destructive/10 text-destructive',
};

type ConfidenceBadgeProps = {
  confidence: DecisionConfidence;
};

export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  const className = cn(
    'rounded-full px-2.5 py-0.5 text-xs font-medium',
    confidenceStyles[confidence.label],
  );
  return (
    <span className={className}>
      confiança {formatConfidence(confidence.value)} · {confidence.label}
    </span>
  );
}
