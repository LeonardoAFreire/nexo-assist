import type { SendMessageRequest } from '@nexo/contracts';
import { useCallback } from 'react';
import { retryTurn } from '../api/retry-turn.js';
import { streamMessage } from '../api/stream-message.js';
import type { TurnState } from './turn-state.js';
import { useTurnStream } from './use-turn-stream.js';

export type SendMessageApi = {
  turn: TurnState;
  send: (text: string) => void;
  retry: () => void;
};

export function useSendMessage(): SendMessageApi {
  const { turn, begin } = useTurnStream();
  const send = useCallback(
    (text: string) => {
      const request: SendMessageRequest = { text, quickReply: null, ticketSelection: null };
      begin((signal) => streamMessage(request, signal), { type: 'submitted', text });
    },
    [begin],
  );
  const retry = useCallback(() => begin(retryTurn, { type: 'retried' }), [begin]);
  return { turn, send, retry };
}
