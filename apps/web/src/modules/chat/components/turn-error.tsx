import { RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TurnError as TurnErrorState } from '../types/nexo-ui-message.js';

type TurnErrorProps = {
  error: TurnErrorState;
  onRetry: () => void;
};

export function TurnError({ error, onRetry }: TurnErrorProps) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-ink"
    >
      <p className="min-w-0 flex-1">{error.message}</p>
      {error.retryable ? (
        <Button type="button" variant="outline" onClick={onRetry}>
          <RotateCw aria-hidden="true" />
          Tentar novamente
        </Button>
      ) : null}
    </div>
  );
}
