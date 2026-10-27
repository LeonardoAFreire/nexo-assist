import type { ConsoleStatus, HandoffInfo, UserProfile } from '@nexo/contracts';
import type { Conversation } from '../conversation/conversation.js';

const MS_PER_MINUTE = 60_000;
const MINUTES_PER_HOUR = 60;
const PERCENT = 100;
const AGENT_INITIATED_REASONS: readonly HandoffInfo['reason'][] = ['low_confidence', 'failure'];

export type DerivedStatus = {
  consoleStatus: ConsoleStatus;
  statusDetail: string | null;
};

export type DeriveStatusInput = {
  conversation: Conversation;
  viewerId: string;
  assignedAnalyst: UserProfile | null;
  now: Date;
};

function contactDetail(handoff: HandoffInfo, now: Date): string {
  const minutes = Math.ceil((Date.parse(handoff.contactDueAt) - now.getTime()) / MS_PER_MINUTE);
  if (minutes <= 0) {
    return 'contato em atraso';
  }
  if (minutes < MINUTES_PER_HOUR) {
    return `contato em ${minutes} min`;
  }
  return `contato em ${Math.ceil(minutes / MINUTES_PER_HOUR)} h`;
}

function waitingStatus(handoff: HandoffInfo | null, now: Date): DerivedStatus {
  if (handoff !== null && AGENT_INITIATED_REASONS.includes(handoff.reason)) {
    const confidence = handoff.confidence;
    const detail = confidence === null ? null : `confiança ${Math.round(confidence * PERCENT)}%`;
    return { consoleStatus: 'agent_asked_help', statusDetail: detail };
  }
  if (handoff === null) {
    return { consoleStatus: 'transferred', statusDetail: null };
  }
  const detail = handoff.ticketNumbers[0] ?? contactDetail(handoff, now);
  return { consoleStatus: 'transferred', statusDetail: detail };
}

export function deriveConsoleStatus(input: DeriveStatusInput): DerivedStatus {
  const { conversation } = input;
  switch (conversation.state) {
    case 'waiting_analyst':
      return waitingStatus(conversation.props.handoff, input.now);
    case 'with_analyst':
      return conversation.props.assignedAnalystId === input.viewerId
        ? { consoleStatus: 'you_are_attending', statusDetail: null }
        : { consoleStatus: 'attended_by_other', statusDetail: input.assignedAnalyst?.name ?? null };
    case 'agent':
      return { consoleStatus: 'agent_attending', statusDetail: null };
    case 'closed':
      return {
        consoleStatus: conversation.props.resolution === 'agent' ? 'resolved_by_agent' : 'closed',
        statusDetail: null,
      };
  }
}
