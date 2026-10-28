import { useChat } from '@ai-sdk/react';
import type { EmployeeConversationView } from '@nexo/contracts';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { NexoUIMessage } from '../types/nexo-ui-message.js';
import { buildChatCommands, type ChatCommands } from './chat-commands.js';
import { NO_FEEDBACK, type TurnFeedback } from './chat-stream-effects.js';
import { createNexoChat } from './create-nexo-chat.js';
import { TurnTracker } from './turn-tracker.js';
import { toUIMessages } from './ui-messages.js';
import { useTimelineSync } from './use-timeline-sync.js';

const RENDER_THROTTLE_MS = 40;

export type NexoChat = ChatCommands & {
  messages: NexoUIMessage[];
  active: boolean;
  busy: boolean;
  feedback: TurnFeedback;
};

function useChatInstance(view: EmployeeConversationView) {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<TurnFeedback>(NO_FEEDBACK);
  const [setup] = useState(() => {
    const tracker = new TurnTracker();
    const deps = { queryClient, tracker, setFeedback };
    const chat = createNexoChat(deps, toUIMessages(view.timeline));
    return { chat, commands: buildChatCommands({ chat, tracker, setFeedback }) };
  });
  return { ...setup, feedback };
}

export function useNexoChat(view: EmployeeConversationView): NexoChat {
  const { chat, commands, feedback } = useChatInstance(view);
  const { messages, status, setMessages } = useChat<NexoUIMessage>({
    chat,
    experimental_throttle: RENDER_THROTTLE_MS,
  });
  const active = status === 'submitted' || status === 'streaming';
  useTimelineSync({ timeline: view.timeline, active, setMessages });
  return { ...commands, messages, active, busy: active || view.turnInProgress, feedback };
}
