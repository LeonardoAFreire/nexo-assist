import type { ConversationResolution, ConversationState, HandoffInfo } from '@nexo/contracts';

export type ConversationProps = {
  id: string;
  employeeId: string;
  state: ConversationState;
  resolution: ConversationResolution | null;
  assignedAnalystId: string | null;
  handoff: HandoffInfo | null;
  lastMessageAt: string;
  analystReadAt: string | null;
  turnLockUntil: string | null;
  closedAt: string | null;
};
