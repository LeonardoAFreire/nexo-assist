import { CONSOLE_SEARCH_MAX_LENGTH } from '@nexo/contracts';
import { Search } from 'lucide-react';

type ConversationSearchProps = {
  value: string;
  onChange: (value: string) => void;
};

export function ConversationSearch({ value, onChange }: ConversationSearchProps) {
  return (
    <div className="flex h-9 items-center gap-2.5 rounded-full bg-desk px-3 focus-within:ring-3 focus-within:ring-ring/40">
      <Search aria-hidden="true" className="size-[15px] shrink-0 text-ink-3" />
      <input
        type="search"
        aria-label="Pesquisar conversa ou chamado"
        placeholder="Pesquisar conversa ou chamado"
        maxLength={CONSOLE_SEARCH_MAX_LENGTH}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 bg-transparent text-[13.5px] text-ink outline-none placeholder:text-ink-3"
      />
    </div>
  );
}
