import type { PendingAction } from '@nexo/contracts';
import { pendingKindLabels } from './affected-labels.js';

export function actionTitle(action: PendingAction): string {
  return `${pendingKindLabels[action.kind]} ${action.displayNumber}`;
}
