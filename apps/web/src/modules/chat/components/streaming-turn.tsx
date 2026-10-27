import type { TurnState } from '../hooks/turn-state.js';
import { AgentMessage } from './agent-message.js';
import { EmployeeMessage } from './employee-message.js';

type StreamingTurnProps = {
  turn: TurnState;
};

export function StreamingTurn({ turn }: StreamingTurnProps) {
  if (turn.status !== 'streaming') {
    return null;
  }

  return (
    <div className="flex flex-col gap-5">
      {turn.pendingText ? <EmployeeMessage text={turn.pendingText} /> : null}
      <AgentMessage
        messageId={null}
        text={turn.text}
        steps={turn.steps}
        parts={turn.parts}
        decision={null}
        busy
      />
    </div>
  );
}
