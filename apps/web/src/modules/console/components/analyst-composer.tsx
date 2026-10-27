import { MESSAGE_TEXT_MAX_LENGTH } from '@nexo/contracts';
import { Button } from '@/components/ui/button';
import { useComposerForm } from '../hooks/use-composer-form.js';

const SEND_FAILED_MESSAGE = 'Não foi possível enviar a mensagem. Tente de novo.';

type AnalystComposerProps = {
  conversationId: string;
};

export function AnalystComposer({ conversationId }: AnalystComposerProps) {
  const form = useComposerForm(conversationId);
  return (
    <form onSubmit={form.submit} className="flex flex-col gap-2 border-t border-rule px-6 py-4">
      <div className="flex items-end gap-3">
        <textarea
          aria-label="Resposta ao funcionário"
          placeholder="Escreva a resposta ao funcionário"
          rows={2}
          maxLength={MESSAGE_TEXT_MAX_LENGTH}
          value={form.text}
          onChange={(event) => form.setText(event.target.value)}
          className="min-h-14 flex-1 resize-none rounded-xl border border-input px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <Button type="submit" disabled={!form.canSend}>
          Enviar
        </Button>
      </div>
      {form.failed ? (
        <p role="alert" className="text-[13px] text-destructive">
          {SEND_FAILED_MESSAGE}
        </p>
      ) : null}
    </form>
  );
}
