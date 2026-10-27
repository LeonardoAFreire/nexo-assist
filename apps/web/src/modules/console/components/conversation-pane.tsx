import { Button } from '@/components/ui/button';
import { useConsoleConversation } from '../hooks/use-console-conversation.js';
import { useMarkRead } from '../hooks/use-mark-read.js';
import { ConversationView } from './conversation-view.js';

const ERROR_MESSAGE = 'Não foi possível carregar a conversa.';

type ConversationPaneProps = {
  conversationId: string;
  analystId: string;
};

export function ConversationPane({ conversationId, analystId }: ConversationPaneProps) {
  const query = useConsoleConversation(conversationId);
  useMarkRead(conversationId, query.data?.timeline.at(-1)?.id);
  return (
    <section aria-label="Conversa" className="flex min-w-0 flex-1 flex-col">
      {query.isPending ? (
        <output className="p-6 text-sm text-ink-3">Carregando conversa…</output>
      ) : null}
      {query.isError ? (
        <div role="alert" className="flex flex-col items-start gap-3 p-6">
          <p className="text-sm text-destructive">{ERROR_MESSAGE}</p>
          <Button variant="outline" onClick={() => void query.refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : null}
      {query.data ? <ConversationView detail={query.data} analystId={analystId} /> : null}
    </section>
  );
}
