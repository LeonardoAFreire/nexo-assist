import type { ChatMessage } from '@nexo/contracts';
import { useEffect, useRef } from 'react';
import type { NexoUIMessage } from '../types/nexo-ui-message.js';
import { toUIMessages } from './ui-messages.js';

export type TimelineSyncInput = {
  timeline: ChatMessage[];
  active: boolean;
  setMessages: (messages: NexoUIMessage[]) => void;
};

export function useTimelineSync({ timeline, active, setMessages }: TimelineSyncInput): void {
  const synced = useRef(timeline);
  useEffect(() => {
    if (synced.current === timeline) {
      return;
    }
    synced.current = timeline;
    if (!active) {
      setMessages(toUIMessages(timeline));
    }
  }, [timeline, active, setMessages]);
}
