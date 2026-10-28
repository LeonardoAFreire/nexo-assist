import type { ChatMessage, MessageUsage } from '@nexo/contracts';
import type { Conversation } from '../conversation/conversation.js';

export type EmployeeSession = {
  userId: string;
  userName: string;
  sessionId: string;
};

export type TurnContext = {
  session: EmployeeSession;
  conversation: Conversation;
  employeeMessage: ChatMessage;
  replyId: string;
  agentText: string;
  usage: MessageUsage;
  signal: AbortSignal;
};
