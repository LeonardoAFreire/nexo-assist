import type { MessageUsage } from '@nexo/contracts';
import type { RejectedText } from '../types/nexo-ui-message.js';
import { LimitReachedNotice } from './limit-reached-notice.js';
import { MessageComposer } from './message-composer.js';
import { MessageCounter } from './message-counter.js';

export type FooterState = {
  busy: boolean;
  streaming: boolean;
  transferred: boolean;
};

export type HandoffState = {
  pending: boolean;
  error: string | null;
};

type ChatFooterProps = {
  usage: MessageUsage;
  state: FooterState;
  rejection: RejectedText | null;
  handoff: HandoffState;
  onSend: (text: string) => void;
  onStop: () => void;
  onHandoff: () => void;
};

const PLACEHOLDER = 'Escreva para o Nexo…';
const LIMIT_PLACEHOLDER = 'Limite de mensagens atingido';
const TRANSFERRED_PLACEHOLDER = 'Escreva para o analista…';

function placeholderFor(limitReached: boolean, transferred: boolean): string {
  if (limitReached) {
    return LIMIT_PLACEHOLDER;
  }
  return transferred ? TRANSFERRED_PLACEHOLDER : PLACEHOLDER;
}

export function ChatFooter(props: ChatFooterProps) {
  const { usage, state, rejection, handoff, onSend, onStop, onHandoff } = props;
  const limitReached = usage.messagesUsed >= usage.messagesLimit;
  return (
    <footer className="flex flex-col gap-1.5 overflow-y-hidden md:[scrollbar-gutter:stable] px-4 pt-2.5 pb-[18px] md:px-12 lg:px-32 xl:px-50">
      <div className="mx-auto flex w-full max-w-[808px] flex-col gap-1.5">
        {limitReached ? (
          <LimitReachedNotice
            pending={handoff.pending}
            errorMessage={handoff.error}
            onHandoff={onHandoff}
          />
        ) : null}
        <MessageComposer
          locked={limitReached}
          waiting={state.busy}
          streaming={state.streaming}
          placeholder={placeholderFor(limitReached, state.transferred)}
          rejection={rejection}
          onSend={onSend}
          onStop={onStop}
        />
        <MessageCounter usage={usage} />
      </div>
    </footer>
  );
}
