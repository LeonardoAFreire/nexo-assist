import { type FormEvent, useState } from 'react';

export type ComposerDraft = {
  text: string;
  canSend: boolean;
  setText: (text: string) => void;
  submit: (event: FormEvent<HTMLFormElement>) => void;
};

export function useComposerDraft(disabled: boolean, onSend: (text: string) => void): ComposerDraft {
  const [text, setText] = useState('');
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
