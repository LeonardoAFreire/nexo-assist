import type { QuickOption } from '@nexo/contracts';
import { useCallback } from 'react';
import { useChatActions } from './chat-actions-context.js';

export function useQuickPick(messageId: string | null): (option: QuickOption) => void {
  const { reply } = useChatActions();
  return useCallback(
    (option: QuickOption) => {
      if (messageId) {
        const quickReply = { messageId, optionId: option.id };
        reply({ text: option.label, quickReply, ticketSelection: null });
      }
    },
    [messageId, reply],
  );
}
