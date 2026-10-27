import type { AgentRunRepository } from './agent-run-repository.js';
import {
  CRITICAL_HANDOFF_TEXT,
  askImpact,
  offerOverdueOptions,
  replyDegraded,
  requestHandoff,
} from './fixed-replies.js';
import { type CompletionInput, buildDecision, buildRun } from './turn-completion.js';
import type { TurnSession } from './turn-session.js';

function isMissingImpact(turn: TurnSession, input: CompletionInput): boolean {
  const { intent, entities } = input.understanding;
  const impactUnknown = entities.impact === null || entities.impact === 'unknown';
  const isOpening = intent === 'ticket_open' && impactUnknown && !input.impactAsked;
  return isOpening && !turn.observer.hasNextStep();
}

export class TurnFinisher {
  constructor(private readonly runs: AgentRunRepository) {}

  async finish(turn: TurnSession, input: CompletionInput): Promise<void> {
    if (input.degradation) {
      replyDegraded(turn);
    } else {
      this.applyPostRules(turn, input);
    }
    const decision = buildDecision(turn, input);
    await this.runs.save(buildRun(turn, input, decision));
    turn.emit({
      type: 'completed',
      text: turn.observer.text,
      steps: turn.recorder.steps,
      decision,
      runId: turn.runId,
    });
  }

  private applyPostRules(turn: TurnSession, input: CompletionInput): void {
    if (turn.observer.criticalDraft && !turn.observer.handoff) {
      requestHandoff(turn, input.understanding, 'critical');
      turn.say(CRITICAL_HANDOFF_TEXT);
    }
    if (turn.observer.overdueShown && !turn.observer.quickOptionsShown) {
      offerOverdueOptions(turn);
    }
    if (isMissingImpact(turn, input)) {
      askImpact(turn);
    }
  }
}
