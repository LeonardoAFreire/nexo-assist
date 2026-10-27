import type { AgentHistoryEntry } from '@nexo/contracts';

const IMPACT_QUESTION_PATTERN = /afetad/i;

export function wasImpactAsked(history: AgentHistoryEntry[]): boolean {
  return history.some(
    (entry) =>
      entry.author === 'agent' &&
      entry.parts.some(
        (part) => part.type === 'quick_options' && IMPACT_QUESTION_PATTERN.test(part.question),
      ),
  );
}
