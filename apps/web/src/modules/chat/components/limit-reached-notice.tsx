import { Headset } from 'lucide-react';
import { Button } from '@/components/ui/button';

type LimitReachedNoticeProps = {
  pending: boolean;
  errorMessage: string | null;
  onHandoff: () => void;
};

export function LimitReachedNotice({ pending, errorMessage, onHandoff }: LimitReachedNoticeProps) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-rule bg-desk px-4 py-3">
      <p className="text-sm text-ink-2">
        Você chegou ao limite de mensagens desta sessão. Um analista pode continuar o atendimento.
      </p>
      <Button type="button" className="w-fit bg-cta" disabled={pending} onClick={onHandoff}>
        <Headset aria-hidden="true" />
        Falar com um analista
      </Button>
      {errorMessage ? (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
