import { MESSAGE_TEXT_MAX_LENGTH } from '@nexo/contracts';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useComposerForm } from '../hooks/use-composer-form.js';

const SEND_FAILED_MESSAGE = 'Não foi possível enviar a mensagem. Tente de novo.';

type AnalystComposerProps = {
  conversationId: string;
};

type ReplyFieldProps = {
  value: string;
  onChange: (value: string) => void;
};

function ReplyField({ value, onChange }: ReplyFieldProps) {
  return (
    <textarea
      aria-label="Resposta ao funcionário"
      placeholder="Escreva a resposta ao funcionário"
      rows={1}
      maxLength={MESSAGE_TEXT_MAX_LENGTH}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="max-h-32 min-h-11 flex-1 resize-none rounded-xl bg-desk px-3.5 py-3 text-[14.5px] text-ink [field-sizing:content] outline-none placeholder:text-ink-3 focus-visible:ring-3 focus-visible:ring-ring/40"
    />
  );
}

export function AnalystComposer({ conversationId }: AnalystComposerProps) {
  const form = useComposerForm(conversationId);
  return (
    <form
      onSubmit={form.submit}
      className="flex flex-col gap-2 border-t border-rule bg-paper px-5 pt-2.5 pb-3.5"
    >
      <div className="flex items-end gap-3">
        <ReplyField value={form.text} onChange={form.setText} />
        <Button
          type="submit"
          aria-label="Enviar"
          disabled={!form.canSend}
          className="size-11 shrink-0 rounded-full bg-cta text-white"
        >
          <ArrowUp aria-hidden="true" className="size-[18px]" />
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
