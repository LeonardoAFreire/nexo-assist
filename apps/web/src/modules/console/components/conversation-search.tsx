import { CONSOLE_SEARCH_MAX_LENGTH } from '@nexo/contracts';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

type ConversationSearchProps = {
  value: string;
  onChange: (value: string) => void;
};

export function ConversationSearch({ value, onChange }: ConversationSearchProps) {
  return (
    <div className="relative">
      <Search aria-hidden="true" className="absolute top-2 left-2.5 size-4 text-ink-3" />
      <Input
        type="search"
        aria-label="Pesquisar conversa ou chamado"
        placeholder="Pesquisar conversa ou chamado"
        maxLength={CONSOLE_SEARCH_MAX_LENGTH}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 pl-8 text-[13px]"
      />
    </div>
  );
}
