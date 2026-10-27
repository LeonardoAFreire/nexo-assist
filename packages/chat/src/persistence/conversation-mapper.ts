import {
  conversationResolutionSchema,
  conversationStateSchema,
  handoffInfoSchema,
} from '@nexo/contracts';
import type { ConversationProps } from '../core/conversation/conversation-props.js';
import type { conversationsTable } from './conversations.table.js';
import { parseStored, toDate, toIso } from './parse-stored.js';

export type ConversationRow = typeof conversationsTable.$inferSelect;

export function toConversationProps(row: ConversationRow): ConversationProps {
  const origin = `chat.conversations ${row.id}`;
  return {
    id: row.id,
    employeeId: row.employeeId,
    state: parseStored({ schema: conversationStateSchema, value: row.state, origin }),
    resolution: parseStored({
      schema: conversationResolutionSchema.nullable(),
      value: row.resolution,
      origin,
    }),
    assignedAnalystId: row.assignedAnalystId,
    handoff: parseStored({ schema: handoffInfoSchema.nullable(), value: row.handoff, origin }),
    lastMessageAt: row.lastMessageAt.toISOString(),
    analystReadAt: toIso(row.analystReadAt),
    turnLockUntil: toIso(row.turnLockUntil),
    closedAt: toIso(row.closedAt),
  };
}

export function toConversationRow(props: ConversationProps): ConversationRow {
  return {
    id: props.id,
    employeeId: props.employeeId,
    state: props.state,
    resolution: props.resolution,
    assignedAnalystId: props.assignedAnalystId,
    handoff: props.handoff,
    lastMessageAt: new Date(props.lastMessageAt),
    analystReadAt: toDate(props.analystReadAt),
    turnLockUntil: toDate(props.turnLockUntil),
    closedAt: toDate(props.closedAt),
  };
}
