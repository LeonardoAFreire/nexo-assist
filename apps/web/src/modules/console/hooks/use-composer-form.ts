import { type FormEvent, useState } from 'react';
import { useAnalystMessage } from './use-analyst-message.js';

export type ComposerForm = {
  text: string;
  setText: (text: string) => void;
  canSend: boolean;
  failed: boolean;
  submit: (event: FormEvent) => void;
};

export function useComposerForm(conversationId: string): ComposerForm {
  const [text, setText] = useState('');
  const sendMessage = useAnalystMessage(conversationId);
  const canSend = text.trim().length > 0 && !sendMessage.isPending;
  function submit(event: FormEvent): void {
    event.preventDefault();
    if (canSend) {
      sendMessage.mutate(text.trim(), { onSuccess: () => setText('') });
    }
  }
  return { text, setText, canSend, failed: sendMessage.isError, submit };
}
