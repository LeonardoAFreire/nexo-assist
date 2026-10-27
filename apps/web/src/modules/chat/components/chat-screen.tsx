import type { Conversation, EmployeeConversationView } from '@nexo/contracts';
import { ChatActionsContext } from '../hooks/chat-actions-context.js';
import { useRequestHandoff } from '../hooks/use-request-handoff.js';
import { useSendMessage } from '../hooks/use-send-message.js';
import { ChatFooter } from './chat-footer.js';
import { ChatThread } from './chat-thread.js';
import { ConversationStateBanner } from './conversation-state-banner.js';

type ChatScreenProps = {
  view: EmployeeConversationView;
};

function isTransferred(conversation: Conversation | null): boolean {
  return conversation?.state === 'waiting_analyst' || conversation?.state === 'with_analyst';
}

export function ChatScreen({ view }: ChatScreenProps) {
  const { turn, send, reply, retry } = useSendMessage();
  const handoff = useRequestHandoff();
  const busy = turn.status === 'streaming' || view.turnInProgress;
  const latestMessageId = view.timeline.at(-1)?.id ?? null;
  return (
    <ChatActionsContext value={{ busy, latestMessageId, reply }}>
      <ConversationStateBanner conversation={view.conversation} />
      <ChatThread view={view} turn={turn} busy={busy} onPick={send} onRetry={retry} />
      <ChatFooter
        usage={view.usage}
        busy={busy}
        transferred={isTransferred(view.conversation)}
        rejection={turn.rejection}
        handoffPending={handoff.isPending}
        handoffError={handoff.error?.message ?? null}
        onSend={send}
        onHandoff={() => handoff.mutate()}
      />
    </ChatActionsContext>
  );
}
