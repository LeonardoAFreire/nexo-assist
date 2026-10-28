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
      className="h-auto rounded-lg border-rule bg-paper px-3 py-[7px] text-[13.5px] font-medium text-ink transition-[background-color,border-color,color,transform] duration-150 hover:border-primary hover:bg-primary-soft hover:text-primary-text motion-safe:active:scale-[0.97]"
    >
      {option.label}
    </Button>
  );
}
