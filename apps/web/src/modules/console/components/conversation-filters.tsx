import type { ConsoleCounters, ConsoleFilter } from '@nexo/contracts';
import { cn } from '@/lib/utils';

type FilterOption = { value: ConsoleFilter; label: string };

const FILTER_OPTIONS: readonly FilterOption[] = [
  { value: 'all', label: 'Todas' },
  { value: 'for_you', label: 'Para você' },
  { value: 'with_agent', label: 'Com o agent' },
  { value: 'mine', label: 'Minhas' },
];

type ConversationFiltersProps = {
  selected: ConsoleFilter;
  counters: ConsoleCounters;
  onSelect: (filter: ConsoleFilter) => void;
};

type FilterButtonProps = {
  option: FilterOption;
  count: number;
  pressed: boolean;
  onSelect: (filter: ConsoleFilter) => void;
};

function FilterButton({ option, count, pressed, onSelect }: FilterButtonProps) {
  const className = cn(
    'flex items-center gap-1 rounded-full px-2 py-1.5 text-[12.5px] font-medium whitespace-nowrap outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
    pressed ? 'bg-primary-soft text-primary-text' : 'bg-desk text-ink-2 hover:bg-rule',
  );
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={`${option.label}, ${count}`}
      className={className}
      onClick={() => onSelect(option.value)}
    >
      {option.label}
      <span className={cn('text-[12.5px] font-semibold', !pressed && 'text-ink-3')}>{count}</span>
    </button>
  );
}

export function ConversationFilters({ selected, counters, onSelect }: ConversationFiltersProps) {
  return (
    <fieldset className="flex flex-wrap gap-1">
      <legend className="sr-only">Filtros de conversas</legend>
      {FILTER_OPTIONS.map((option: FilterOption) => (
        <FilterButton
          key={option.value}
          option={option}
          count={counters[option.value]}
          pressed={selected === option.value}
          onSelect={onSelect}
        />
      ))}
    </fieldset>
  );
}
