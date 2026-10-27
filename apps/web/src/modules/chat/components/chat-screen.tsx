import type { EmployeeConversationView } from '@nexo/contracts';
import { useRequestHandoff } from '../hooks/use-request-handoff.js';
import { useSendMessage } from '../hooks/use-send-message.js';
import { ChatFooter } from './chat-footer.js';
import { ChatThread } from './chat-thread.js';

type ChatScreenProps = {
  view: EmployeeConversationView;
};

export function ChatScreen({ view }: ChatScreenProps) {
  const { turn, send, retry } = useSendMessage();
  const handoff = useRequestHandoff();
  const busy = turn.status === 'streaming' || view.turnInProgress;
  return (
    <>
      <ChatThread view={view} turn={turn} busy={busy} onPick={send} onRetry={retry} />
      <ChatFooter
        usage={view.usage}
        busy={busy}
        rejection={turn.rejection}
        handoffPending={handoff.isPending}
        handoffError={handoff.error?.message ?? null}
        onSend={send}
        onHandoff={() => handoff.mutate()}
      />
    </>
  );
}
