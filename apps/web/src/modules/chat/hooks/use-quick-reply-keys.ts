import type { QuickOption } from '@nexo/contracts';
import { useEffect } from 'react';

export type QuickReplyKeysInput = {
  options: QuickOption[];
  enabled: boolean;
  onPick: (option: QuickOption) => void;
};

function isTypingText(target: EventTarget | null): boolean {
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    return target.value !== '';
  }
  return (
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

function hasModifier(event: KeyboardEvent): boolean {
  return event.ctrlKey || event.metaKey || event.altKey;
}

export function useQuickReplyKeys(input: QuickReplyKeysInput): void {
  const { options, enabled, onPick } = input;
  useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    function handleKeyDown(event: KeyboardEvent): void {
      const option = options[Number(event.key) - 1];
      if (!option || hasModifier(event) || isTypingText(event.target)) {
        return;
      }
      event.preventDefault();
      onPick(option);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [options, enabled, onPick]);
}
