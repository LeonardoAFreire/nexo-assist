import { type RefObject, useEffect, useRef } from 'react';

export function useStickToBottom<T extends HTMLElement>(signal: string): RefObject<T | null> {
  const ref = useRef<T>(null);
  useEffect(() => {
    const element = ref.current;
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }, [signal]);
  return ref;
}
