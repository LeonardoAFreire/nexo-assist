import { Button } from '@/components/ui/button';

export function ChatLoading() {
  return (
    <output className="flex flex-1 items-center justify-center text-sm text-ink-3">
      Carregando a conversa…
    </output>
  );
}

type ChatLoadErrorProps = {
  onRetry: () => void;
};

export function ChatLoadError({ onRetry }: ChatLoadErrorProps) {
  return (
    <div
      role="alert"
      className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center"
    >
      <p className="text-sm text-ink-2">Não foi possível carregar a conversa.</p>
      <Button type="button" variant="outline" onClick={onRetry}>
        Tentar novamente
      </Button>
    </div>
  );
}
