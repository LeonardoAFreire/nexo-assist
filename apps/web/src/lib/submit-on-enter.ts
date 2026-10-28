import type { KeyboardEvent } from 'react';

function isSubmitKey(event: KeyboardEvent<HTMLTextAreaElement>): boolean {
  return event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing;
}

export function submitOnEnter(event: KeyboardEvent<HTMLTextAreaElement>): void {
  if (!isSubmitKey(event)) {
    return;
  }
  event.preventDefault();
  event.currentTarget.form?.requestSubmit();
}
