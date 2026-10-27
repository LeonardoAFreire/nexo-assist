import { useEffect } from 'react';

const ESCAPE_KEY = 'Escape';

export function useEscapeKey(onEscape: () => void): void {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === ESCAPE_KEY) {
        onEscape();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onEscape]);
}
