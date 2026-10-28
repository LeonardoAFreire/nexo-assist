import { MESSAGE_TEXT_MAX_LENGTH } from '@nexo/contracts';
import { useComposerDraft } from '../hooks/use-composer-draft.js';
import type { RejectedText } from '../types/nexo-ui-message.js';
import { ComposerAction } from './composer-action.js';

type MessageComposerProps = {
  locked: boolean;
  waiting: boolean;
  streaming: boolean;
  placeholder: string;
  rejection: RejectedText | null;
  onSend: (text: string) => void;
  onStop: () => void;
};

export function MessageComposer(props: MessageComposerProps) {
  const { locked, waiting, streaming, placeholder, rejection, onSend, onStop } = props;
  const draft = useComposerDraft({ blocked: locked || waiting, rejection, onSend });
  return (
    <form
      onSubmit={draft.submit}
      className="flex items-end gap-2 rounded-xl border border-ink/12 bg-paper py-1.5 pr-1.5 pl-4 transition-shadow duration-200 focus-within:border-ink/20 focus-within:ring-3 focus-within:ring-ring/40"
    >
      <textarea
        aria-label="Mensagem para o Nexo"
        rows={1}
        value={draft.text}
        disabled={locked}
        maxLength={MESSAGE_TEXT_MAX_LENGTH}
        placeholder={placeholder}
        onChange={(event) => draft.setText(event.target.value)}
        onKeyDown={draft.onKeyDown}
        className="field-sizing-content max-h-40 min-h-9 min-w-0 flex-1 resize-none bg-transparent py-[7px] text-[14.5px] leading-[1.45] text-ink outline-none placeholder:text-ink-3 disabled:cursor-not-allowed"
      />
      <ComposerAction streaming={streaming} canSend={draft.canSend} onStop={onStop} />
    </form>
  );
}
