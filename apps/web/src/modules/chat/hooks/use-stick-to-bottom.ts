import { type RefObject, useCallback, useEffect, useRef, useState } from 'react';

const NEAR_BOTTOM_PX = 96;

export type StickToBottom<T extends HTMLElement> = {
  ref: RefObject<T | null>;
  atBottom: boolean;
  onScroll: () => void;
  scrollToBottom: () => void;
};

function isNearBottom(element: HTMLElement): boolean {
  return element.scrollHeight - element.scrollTop - element.clientHeight < NEAR_BOTTOM_PX;
}

export function useStickToBottom<T extends HTMLElement>(
  progress: string,
  anchor: string | null,
): StickToBottom<T> {
  const ref = useRef<T>(null);
  const pinned = useRef(true);
  const [atBottom, setAtBottom] = useState(true);
  useEffect(() => {
    pinned.current = true;
  }, [anchor]);
  useEffect(() => {
    const element = ref.current;
    if (element && pinned.current) {
      element.scrollTop = element.scrollHeight;
    }
  }, [progress, anchor]);
  const onScroll = useCallback(() => {
    const element = ref.current;
    if (element) {
      pinned.current = isNearBottom(element);
      setAtBottom(pinned.current);
    }
  }, []);
  const scrollToBottom = useCallback(() => {
    pinned.current = true;
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' });
  }, []);
  return { ref, atBottom, onScroll, scrollToBottom };
}
