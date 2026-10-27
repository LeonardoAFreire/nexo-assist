import type { ChatStreamEvent } from '@nexo/contracts';
import { idleTurn, type TurnAction, type TurnState } from './turn-state.js';

function applyEvent(state: TurnState, event: ChatStreamEvent): TurnState {
  switch (event.event) {
    case 'message.accepted':
      return { ...state, accepted: true, pendingText: null };
    case 'turn.step':
      return { ...state, steps: [...state.steps, event.data.step] };
    case 'turn.text-delta':
      return { ...state, text: state.text + event.data.delta };
    case 'turn.part':
      return { ...state, parts: [...state.parts, event.data.part] };
    case 'turn.failed': {
      const error = { message: event.data.error.message, retryable: event.data.retryable };
      return { ...state, status: 'failed', error };
    }
    case 'turn.completed':
    case 'turn.skipped':
      return idleTurn;
  }
}

function interrupt(state: TurnState, message: string): TurnState {
  const error = { message, retryable: state.accepted };
  const rejection = state.accepted || !state.pendingText ? null : { text: state.pendingText };
  return { ...state, status: 'failed', pendingText: null, error, rejection };
}

export function turnReducer(state: TurnState, action: TurnAction): TurnState {
  switch (action.type) {
    case 'submitted':
      return { ...idleTurn, status: 'streaming', pendingText: action.text };
    case 'retried':
      return { ...idleTurn, status: 'streaming', accepted: true };
    case 'event':
      return applyEvent(state, action.event);
    case 'interrupted':
      return interrupt(state, action.message);
  }
}
