import type { Chat } from '@ai-sdk/react';
import type { QueryClient } from '@tanstack/react-query';
import type { DataUIPart } from 'ai';
import type {
  NexoDataParts,
  NexoUIMessage,
  RejectedText,
  TimelineUpdater,
  TurnError,
} from '../types/nexo-ui-message.js';
import { invalidateConversation, updateView } from './conversation-cache.js';
import { markReplied } from './mark-replied.js';
import { turnErrorMessage } from './turn-error-message.js';
import type { TurnTracker } from './turn-tracker.js';
import { applyTimelineUpdate, attachAccepted, withoutPendingUser } from './ui-messages.js';

export type TurnFeedback = {
  error: TurnError | null;
  rejection: RejectedText | null;
};

export const NO_FEEDBACK: TurnFeedback = { error: null, rejection: null };

export type ChatEffects = {
  queryClient: QueryClient;
  tracker: TurnTracker;
  setFeedback: (feedback: TurnFeedback) => void;
  chat: () => Chat<NexoUIMessage>;
};

type AcceptedData = NexoDataParts['accepted'];

export function timelineUpdaterOf(chat: () => Chat<NexoUIMessage>): TimelineUpdater {
  return (update) => {
    const target = chat();
    target.messages = applyTimelineUpdate(target.messages, update);
  };
}

function acceptMessage(data: AcceptedData, effects: ChatEffects): void {
  const request = effects.tracker.accept();
  updateView(effects.queryClient, (view) => ({ ...view, usage: data.usage }));
  const chat = effects.chat();
  chat.messages = attachAccepted(chat.messages, data.message);
  if (request !== null) {
    timelineUpdaterOf(effects.chat)(markReplied(request));
  }
}

export function handleData(part: DataUIPart<NexoDataParts>, effects: ChatEffects): void {
  if (part.type === 'data-accepted') {
    acceptMessage(part.data, effects);
  }
  if (part.type === 'data-completed') {
    const { conversation, usage } = part.data;
    updateView(effects.queryClient, (view) => ({ ...view, conversation, usage }));
  }
  if (part.type === 'data-skipped') {
    invalidateConversation(effects.queryClient);
  }
}

export function handleError(error: Error, effects: ChatEffects): void {
  const message = turnErrorMessage(error);
  if (effects.tracker.accepted) {
    effects.setFeedback({ error: { message, retryable: true }, rejection: null });
    return;
  }
  const text = effects.tracker.pendingText;
  const chat = effects.chat();
  chat.messages = withoutPendingUser(chat.messages);
  const rejection = text === null ? null : { text };
  effects.setFeedback({ error: { message, retryable: false }, rejection });
}
