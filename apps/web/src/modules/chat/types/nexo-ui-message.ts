import type {
  AgentStep,
  SendMessageRequest,
  ChatMessage,
  Conversation,
  MessagePart,
  MessageUsage,
} from '@nexo/contracts';
import type { UIMessage, UIMessageChunk } from 'ai';

export type ReplyRequest = Omit<SendMessageRequest, 'clientMessageId'>;

export type TurnError = {
  message: string;
  retryable: boolean;
};

export type RejectedText = {
  text: string;
};

export type NexoMessageMetadata = {
  message?: ChatMessage;
  failure?: TurnError;
};

export type NexoDataParts = {
  step: AgentStep;
  part: MessagePart;
  accepted: { message: ChatMessage; usage: MessageUsage };
  completed: { conversation: Conversation; usage: MessageUsage };
  skipped: { reason: 'waiting_analyst' | 'with_analyst' };
};

export type NexoUIMessage = UIMessage<NexoMessageMetadata, NexoDataParts>;

export type NexoChunk = UIMessageChunk<NexoMessageMetadata, NexoDataParts>;

export type TimelineUpdate = (timeline: ChatMessage[]) => ChatMessage[];

export type TimelineUpdater = (update: TimelineUpdate) => void;
