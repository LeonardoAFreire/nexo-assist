import { MESSAGE_TEXT_MAX_LENGTH } from '@nexo/contracts';
import { SendHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useComposerDraft } from '../hooks/use-composer-draft.js';
import type { RejectedText } from '../hooks/turn-state.js';

type MessageComposerProps = {
  disabled: boolean;
  placeholder: string;
  rejection: RejectedText | null;
  onSend: (text: string) => void;
};

export function MessageComposer(props: MessageComposerProps) {
  const { disabled, placeholder, rejection, onSend } = props;
  const draft = useComposerDraft(disabled, onSend, rejection);
  return (
    <form
      onSubmit={draft.submit}
      className="flex h-12 items-center gap-2 rounded-xl border border-ink/12 bg-paper pr-1.5 pl-4 focus-within:ring-3 focus-within:ring-ring/40"
    >
      <input
        type="text"
        aria-label="Mensagem para o Nexo"
        autoComplete="off"
        value={draft.text}
        disabled={disabled}
        maxLength={MESSAGE_TEXT_MAX_LENGTH}
        placeholder={placeholder}
        onChange={(event) => draft.setText(event.target.value)}
        className="min-w-0 flex-1 bg-transparent text-[14.5px] text-ink outline-none placeholder:text-ink-3 disabled:cursor-not-allowed"
      />
      <Button type="submit" disabled={!draft.canSend} className="h-9 bg-cta px-3">
        <SendHorizontal aria-hidden="true" />
        Enviar
      </Button>
    </form>
  );
}
