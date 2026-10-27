import type { SendMessageRequest } from '@nexo/contracts';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { retryTurn } from '../api/retry-turn.js';
import { streamMessage } from '../api/stream-message.js';
import { afterAccepted, markReplied } from './mark-replied.js';
import type { TurnState } from './turn-state.js';
import { useTurnStream } from './use-turn-stream.js';

export type SendMessageApi = {
  turn: TurnState;
  send: (text: string) => void;
  reply: (request: SendMessageRequest) => void;
  retry: () => void;
};

export function useSendMessage(): SendMessageApi {
  const queryClient = useQueryClient();
  const { turn, begin } = useTurnStream();
  const reply = useCallback(
    (request: SendMessageRequest) => {
      const open = (signal: AbortSignal) =>
        afterAccepted(streamMessage(request, signal), () => markReplied(queryClient, request));
      begin(open, { type: 'submitted', text: request.text });
    },
    [begin, queryClient],
  );
  const send = useCallback(
    (text: string) => reply({ text, quickReply: null, ticketSelection: null }),
    [reply],
  );
  const retry = useCallback(() => begin(retryTurn, { type: 'retried' }), [begin]);
  return { turn, send, reply, retry };
}
