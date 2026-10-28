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

function useFollowContent(ref: RefObject<HTMLElement | null>, pinned: RefObject<boolean>): void {
  useEffect(() => {
    const element = ref.current;
    const content = element?.firstElementChild;
    if (!element || !content) {
      return;
    }
    const follow = new ResizeObserver(() => {
      if (pinned.current) {
        element.scrollTop = element.scrollHeight;
      }
    });
    follow.observe(content);
    return () => follow.disconnect();
  }, [ref, pinned]);
}

export function useStickToBottom<T extends HTMLElement>(anchor: string | null): StickToBottom<T> {
  const ref = useRef<T>(null);
  const pinned = useRef(true);
  const [atBottom, setAtBottom] = useState(true);
  useFollowContent(ref, pinned);
  useEffect(() => {
    pinned.current = true;
    const element = ref.current;
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }, [anchor]);
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
