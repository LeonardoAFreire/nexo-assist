import type { ConsoleCounters, ConsoleFilter } from '@nexo/contracts';
import { useState } from 'react';
import { useConsoleConversations } from '../hooks/use-console-conversations.js';
import { useDebouncedValue } from '../hooks/use-debounced-value.js';
import { ConversationFilters } from './conversation-filters.js';
import { ConversationList } from './conversation-list.js';
import { ConversationSearch } from './conversation-search.js';

const SEARCH_DEBOUNCE_IN_MS = 250;
const EMPTY_COUNTERS: ConsoleCounters = { all: 0, for_you: 0, with_agent: 0, mine: 0 };

export function ConversationListPane() {
  const [filter, setFilter] = useState<ConsoleFilter>('all');
  const [search, setSearch] = useState('');
  const q = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_IN_MS);
  const query = useConsoleConversations({ filter, q });
  return (
    <section
      aria-label="Lista de conversas"
      className="flex w-95 shrink-0 flex-col border-r border-rule"
    >
      <div className="flex flex-col gap-3 px-4 pt-4 pb-2.5">
        <h1 className="text-lg font-bold tracking-tight text-ink">Conversas</h1>
        <ConversationSearch value={search} onChange={setSearch} />
        <ConversationFilters
          selected={filter}
          counters={query.data?.counters ?? EMPTY_COUNTERS}
          onSelect={setFilter}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ConversationList query={query} />
      </div>
    </section>
  );
}
