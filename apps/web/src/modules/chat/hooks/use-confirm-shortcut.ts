import { useEffect } from 'react';

const CONFIRM_KEY = 'Enter';

export function useConfirmShortcut(enabled: boolean, onConfirm: () => void): void {
  useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key !== CONFIRM_KEY || !(event.ctrlKey || event.metaKey)) {
        return;
      }
      event.preventDefault();
      onConfirm();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled, onConfirm]);
}
