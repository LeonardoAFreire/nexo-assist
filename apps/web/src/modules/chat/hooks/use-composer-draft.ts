import { type FormEvent, useState } from 'react';
import type { RejectedText } from './turn-state.js';

export type ComposerDraft = {
  text: string;
  canSend: boolean;
  setText: (text: string) => void;
  submit: (event: FormEvent<HTMLFormElement>) => void;
};

export function useComposerDraft(
  disabled: boolean,
  onSend: (text: string) => void,
  rejection: RejectedText | null,
): ComposerDraft {
  const [text, setText] = useState('');
  const [restored, setRestored] = useState<RejectedText | null>(null);
  if (rejection && rejection !== restored) {
    setRestored(rejection);
    setText(rejection.text);
  }
  const trimmed = text.trim();
  const canSend = !disabled && trimmed !== '';

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!canSend) {
      return;
    }
    onSend(trimmed);
    setText('');
  }

  return { text, canSend, setText, submit };
}
