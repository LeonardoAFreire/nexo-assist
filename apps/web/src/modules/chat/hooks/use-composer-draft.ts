import { type FormEvent, useState } from 'react';
import type { RejectedText } from '../types/nexo-ui-message.js';

export type ComposerDraft = {
  text: string;
  canSend: boolean;
  setText: (text: string) => void;
  submit: (event: FormEvent<HTMLFormElement>) => void;
};

export type ComposerDraftInput = {
  blocked: boolean;
  rejection: RejectedText | null;
  onSend: (text: string) => void;
};

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
  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    send();
  };
  return { text, canSend, setText, submit };
}
