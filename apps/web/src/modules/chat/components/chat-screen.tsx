import type { Conversation, EmployeeConversationView } from '@nexo/contracts';
import { type ChatActions, ChatActionsContext } from '../hooks/chat-actions-context.js';
import { currentTurnError } from '../hooks/current-turn-error.js';
import { messageKey } from '../hooks/ui-messages.js';
import { useConversationEvents } from '../hooks/use-conversation-events.js';
import { type NexoChat, useNexoChat } from '../hooks/use-nexo-chat.js';
import { useRequestHandoff } from '../hooks/use-request-handoff.js';
import { ChatFooter, type FooterState } from './chat-footer.js';
import { ChatThread } from './chat-thread.js';
import { ConversationStateBanner } from './conversation-state-banner.js';

type ChatScreenProps = {
  view: EmployeeConversationView;
};

function isTransferred(conversation: Conversation | null): boolean {
  return conversation?.state === 'waiting_analyst' || conversation?.state === 'with_analyst';
}

function footerStateOf(chat: NexoChat, conversation: Conversation | null): FooterState {
  return { busy: chat.busy, streaming: chat.active, transferred: isTransferred(conversation) };
}

function chatActionsOf(chat: NexoChat): ChatActions {
  const last = chat.messages.at(-1);
  const latestMessageId = last ? messageKey(last) : null;
  return {
    busy: chat.busy,
    latestMessageId,
    reply: chat.reply,
    updateTimeline: chat.updateTimeline,
  };
}

function streamingIdOf(chat: NexoChat): string | null {
  const last = chat.messages.at(-1);
  return chat.active && last?.role === 'assistant' ? last.id : null;
}

export function ChatScreen({ view }: ChatScreenProps) {
  const chat = useNexoChat(view);
  const handoff = useRequestHandoff();
  useConversationEvents(chat.updateTimeline);
  return (
    <ChatActionsContext value={chatActionsOf(chat)}>
      <ConversationStateBanner conversation={view.conversation} />
      <ChatThread
        messages={chat.messages}
        streamingId={streamingIdOf(chat)}
        busy={chat.busy}
        error={currentTurnError(chat.messages, chat.feedback, chat.active)}
        onPick={chat.send}
        onRetry={chat.retry}
      />
      <ChatFooter
        usage={view.usage}
        state={footerStateOf(chat, view.conversation)}
        rejection={chat.feedback.rejection}
        handoff={{ pending: handoff.isPending, error: handoff.error?.message ?? null }}
        onSend={chat.send}
        onStop={chat.stop}
        onHandoff={() => handoff.mutate()}
      />
    </ChatActionsContext>
  );
}
