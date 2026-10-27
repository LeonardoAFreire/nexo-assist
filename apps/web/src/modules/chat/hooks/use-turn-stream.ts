import type { ChatStreamEvent } from '@nexo/contracts';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useReducer, useRef } from 'react';
import { runTurn } from './run-turn.js';
import { turnReducer } from './turn-reducer.js';
import { idleTurn, type TurnAction, type TurnState } from './turn-state.js';

export type OpenStream = (signal: AbortSignal) => AsyncGenerator<ChatStreamEvent>;

export type TurnStream = {
  turn: TurnState;
  begin: (open: OpenStream, action: TurnAction) => void;
};

export function useTurnStream(): TurnStream {
  const queryClient = useQueryClient();
  const [turn, dispatch] = useReducer(turnReducer, idleTurn);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const begin = useCallback(
    (open: OpenStream, action: TurnAction) => {
      controller.current?.abort();
      const next = new AbortController();
      controller.current = next;
      dispatch(action);
      void runTurn({ stream: open(next.signal), signal: next.signal, dispatch, queryClient });
    },
    [queryClient],
  );
  return { turn, begin };
}
