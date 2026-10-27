import type { UseQueryResult } from '@tanstack/react-query';
import type { ConsoleList } from '@nexo/contracts';
import { Button } from '@/components/ui/button';
import { ConversationListItem } from './conversation-list-item.js';

const EMPTY_MESSAGE = 'Nenhuma conversa neste filtro';
const ERROR_MESSAGE = 'Não foi possível carregar as conversas.';

type ConversationListProps = {
  query: UseQueryResult<ConsoleList>;
};

function ListMessage({ children }: { children: string }) {
  return <p className="px-4 py-8 text-center text-[13.5px] text-ink-3">{children}</p>;
}

export function ConversationList({ query }: ConversationListProps) {
  if (query.isError) {
    return (
      <div role="alert" className="flex flex-col items-center gap-3 px-4 py-8 text-center">
        <p className="text-[13.5px] text-destructive">{ERROR_MESSAGE}</p>
        <Button variant="outline" onClick={() => void query.refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }
  if (query.isPending) {
    return (
      <output className="block px-4 py-8 text-center text-[13.5px] text-ink-3">
        Carregando conversas…
      </output>
    );
  }
  if (query.data.items.length === 0) {
    return <ListMessage>{EMPTY_MESSAGE}</ListMessage>;
  }
  return (
    <ul aria-label="Conversas">
      {query.data.items.map((item) => (
        <ConversationListItem key={item.id} item={item} />
      ))}
    </ul>
  );
}
