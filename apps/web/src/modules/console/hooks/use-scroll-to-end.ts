import { type RefObject, useEffect, useRef } from 'react';

export function useScrollToEnd<T extends HTMLElement>(changeKey: number): RefObject<T | null> {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [changeKey]);
  return ref;
}
