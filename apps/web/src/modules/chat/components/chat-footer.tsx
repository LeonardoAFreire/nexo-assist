import type { MessageUsage } from '@nexo/contracts';
import type { RejectedText } from '../hooks/turn-state.js';
import { LimitReachedNotice } from './limit-reached-notice.js';
import { MessageComposer } from './message-composer.js';
import { MessageCounter } from './message-counter.js';

type ChatFooterProps = {
  usage: MessageUsage;
  busy: boolean;
  transferred: boolean;
  rejection: RejectedText | null;
  handoffPending: boolean;
  handoffError: string | null;
  onSend: (text: string) => void;
  onHandoff: () => void;
};

const PLACEHOLDER = 'Escreva para o Nexo…';
const LIMIT_PLACEHOLDER = 'Limite de mensagens atingido';
const TRANSFERRED_PLACEHOLDER = 'Escreva para o analista…';

export function ChatFooter(props: ChatFooterProps) {
  const { usage, busy, transferred, rejection, handoffPending, handoffError } = props;
  const { onSend, onHandoff } = props;
  const limitReached = usage.messagesUsed >= usage.messagesLimit;
  const available = transferred ? TRANSFERRED_PLACEHOLDER : PLACEHOLDER;
  return (
    <footer className="flex flex-col gap-2 px-4 pt-2.5 pb-4 md:px-12 lg:px-32 xl:px-48">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-2">
        {limitReached ? (
          <LimitReachedNotice
            pending={handoffPending}
            errorMessage={handoffError}
            onHandoff={onHandoff}
          />
        ) : null}
        <MessageComposer
          disabled={busy || limitReached}
          placeholder={limitReached ? LIMIT_PLACEHOLDER : available}
          rejection={rejection}
          onSend={onSend}
        />
        <MessageCounter usage={usage} />
      </div>
    </footer>
  );
}
