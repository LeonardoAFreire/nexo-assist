import { NexoMark } from '@/components/nexo-mark';

const SUGGESTIONS = [
  'Meu notebook não conecta na VPN desde ontem',
  'Qual o status do meu chamado?',
  'Preciso de acesso a uma pasta compartilhada',
];

type EmptyConversationProps = {
  disabled: boolean;
  onPick: (text: string) => void;
};

export function EmptyConversation({ disabled, onPick }: EmptyConversationProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <span className="flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary-text">
        <NexoMark className="size-6" />
      </span>
      <h2 className="font-display text-2xl font-semibold text-ink">Como posso ajudar?</h2>
      <p className="max-w-md text-[14.5px] text-ink-3">
        Conte o que está acontecendo. Eu consulto a central de ajuda e os seus chamados e, se
        precisar, abro um chamado ou chamo um analista.
      </p>
      <ul aria-label="Sugestões" className="mt-2 flex flex-wrap justify-center gap-2">
        {SUGGESTIONS.map((suggestion: string) => (
          <li key={suggestion}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onPick(suggestion)}
              className="rounded-lg border border-rule bg-paper px-3 py-2 text-[13.5px] font-medium text-ink outline-none hover:bg-desk focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
            >
              {suggestion}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
