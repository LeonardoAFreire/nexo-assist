import { ArrowUp, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ComposerActionProps = {
  streaming: boolean;
  canSend: boolean;
  onStop: () => void;
};

const ACTION_CLASS = 'h-9 shrink-0 gap-1.5 rounded-md px-3 text-[13.5px] font-semibold';

export function ComposerAction({ streaming, canSend, onStop }: ComposerActionProps) {
  if (streaming) {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={onStop}
        className={`${ACTION_CLASS} border-ink/15 text-ink`}
      >
        <Square aria-hidden="true" className="size-3 fill-current" />
        Parar
      </Button>
    );
  }
  return (
    <Button type="submit" disabled={!canSend} className={`${ACTION_CLASS} bg-cta text-white`}>
      <ArrowUp aria-hidden="true" className="size-3.5" />
      Enviar
    </Button>
  );
}
