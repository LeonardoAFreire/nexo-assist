import type { Chat } from '@ai-sdk/react';
import type { NexoUIMessage, ReplyRequest, TimelineUpdater } from '../types/nexo-ui-message.js';
import { NO_FEEDBACK, type TurnFeedback, timelineUpdaterOf } from './chat-stream-effects.js';
import type { TurnTracker } from './turn-tracker.js';

export type ChatCommands = {
  reply: (request: ReplyRequest) => void;
  send: (text: string) => void;
  retry: () => void;
  stop: () => void;
  updateTimeline: TimelineUpdater;
};

export type ChatCommandDeps = {
  chat: Chat<NexoUIMessage>;
  tracker: TurnTracker;
  setFeedback: (feedback: TurnFeedback) => void;
};

export function buildChatCommands(deps: ChatCommandDeps): ChatCommands {
  const { chat, tracker, setFeedback } = deps;
  const reply = (request: ReplyRequest): void => {
    tracker.begin(request);
    setFeedback(NO_FEEDBACK);
    const body = { quickReply: request.quickReply, ticketSelection: request.ticketSelection };
    void chat.sendMessage({ text: request.text }, { body });
  };
  return {
    reply,
    send: (text: string) => reply({ text, quickReply: null, ticketSelection: null }),
    retry: () => {
      tracker.beginRetry();
      setFeedback(NO_FEEDBACK);
      void chat.regenerate();
    },
    stop: () => void chat.stop(),
    updateTimeline: timelineUpdaterOf(() => chat),
  };
}
