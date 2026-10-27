import { OVERDUE_LABEL } from './labels.js';

export function OverdueLabel() {
  return <span className="text-xs font-medium text-destructive">· {OVERDUE_LABEL}</span>;
}
