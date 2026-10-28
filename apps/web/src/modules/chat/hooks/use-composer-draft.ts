import { type FormEvent, type KeyboardEvent, useState } from 'react';
import type { RejectedText } from '../types/nexo-ui-message.js';

export type ComposerDraft = {
  text: string;
  canSend: boolean;
  setText: (text: string) => void;
  submit: (event: FormEvent<HTMLFormElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
};

export type ComposerDraftInput = {
  blocked: boolean;
  rejection: RejectedText | null;
  onSend: (text: string) => void;
};

function isSendKey(event: KeyboardEvent<HTMLTextAreaElement>): boolean {
  return event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing;
}

export function useComposerDraft({
  blocked,
  rejection,
  onSend,
}: ComposerDraftInput): ComposerDraft {
  const [text, setText] = useState('');
  const [restored, setRestored] = useState<RejectedText | null>(null);
  if (rejection && rejection !== restored) {
    setRestored(rejection);
    setText(rejection.text);
  }
  const trimmed = text.trim();
  const canSend = !blocked && trimmed !== '';
  const send = (): void => {
    if (canSend) {
      onSend(trimmed);
      setText('');
    }
  };
  return { text, canSend, setText, ...submitHandlers(send) };
}

function submitHandlers(send: () => void): Pick<ComposerDraft, 'submit' | 'onKeyDown'> {
  return {
    submit: (event) => {
      event.preventDefault();
      send();
    },
    onKeyDown: (event) => {
      if (isSendKey(event)) {
        event.preventDefault();
        send();
      }
    },
  };
}
