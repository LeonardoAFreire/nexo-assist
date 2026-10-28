import { useParams } from 'react-router';
import { ConversationListPane } from '../components/conversation-list-pane.js';
import { ConversationPane } from '../components/conversation-pane.js';
import { EmployeeTicketsPanel } from '../components/employee-tickets-panel.js';
import { useConsoleEvents } from '../hooks/use-console-events.js';

const EMPTY_SELECTION_MESSAGE = 'Selecione uma conversa para ver o atendimento.';

type ConsolePageProps = {
  analystId: string;
};

export function ConsolePage({ analystId }: ConsolePageProps) {
  const { conversationId } = useParams();
  useConsoleEvents(conversationId);
  return (
    <div className="flex h-full min-h-0">
      <ConversationListPane />
      {conversationId ? (
        <>
          <ConversationPane
            key={`conversation-${conversationId}`}
            conversationId={conversationId}
            analystId={analystId}
          />
          <EmployeeTicketsPanel
            key={`tickets-${conversationId}`}
            conversationId={conversationId}
            analystId={analystId}
          />
        </>
      ) : (
        <p className="flex flex-1 items-center justify-center text-sm text-ink-3">
          {EMPTY_SELECTION_MESSAGE}
        </p>
      )}
    </div>
  );
}
