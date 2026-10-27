import type { PendingAction } from '@nexo/contracts';

export type PendingActionRecord = PendingAction & { conversationId: string };

export type PendingActionProposal = Pick<
  PendingAction,
  'kind' | 'draft' | 'targetNumber' | 'complement'
>;
