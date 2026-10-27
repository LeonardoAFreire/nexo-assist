import type { QuickOption } from '@nexo/contracts';
import { Button } from '@/components/ui/button';

type QuickOptionButtonProps = {
  option: QuickOption;
  shortcut: number;
  disabled: boolean;
  onPick: (option: QuickOption) => void;
};

export function QuickOptionButton({ option, shortcut, disabled, onPick }: QuickOptionButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      disabled={disabled}
      aria-keyshortcuts={String(shortcut)}
      onClick={() => onPick(option)}
      className="h-9 rounded-full border-ink/15 bg-paper px-3.5 text-[13.5px] text-ink"
    >
      <kbd aria-hidden="true" className="rounded bg-desk px-1.5 text-xs font-medium text-ink-3">
        {shortcut}
      </kbd>
      {option.label}
    </Button>
  );
}
