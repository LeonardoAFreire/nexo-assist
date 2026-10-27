import type { AgentStep } from '@nexo/contracts';
import type { AttemptFailure } from '@nexo/shared/resilience';
import type { AgentTool } from './agent-tool.js';
import { describeStepFailure } from './step-failure.js';
import type { TurnContext } from './turn-context.js';

const FIRST_ATTEMPT = 1;
const STEP_ID_PREFIX = 's';

export type StepOutcome = Pick<AgentStep, 'kind' | 'label' | 'result' | 'status'>;

export class StepRecorder {
  private readonly recorded: AgentStep[] = [];
  private readonly appliedRules: string[] = [];
  private attempts = FIRST_ATTEMPT;

  get steps(): AgentStep[] {
    return [...this.recorded];
  }

  get rules(): string[] {
    return [...this.appliedRules];
  }

  readonly onAttemptFailed = (failure: AttemptFailure): void => {
    const nextAttempt = failure.willRetry ? failure.attempt + 1 : failure.attempt;
    this.attempts = Math.max(this.attempts, nextAttempt);
  };

  wrap<I, O>(tool: AgentTool<I, O>): AgentTool<I, O> {
    return { ...tool, execute: (input, context) => this.run(tool, input, context) };
  }

  note(context: TurnContext, outcome: StepOutcome): void {
    this.attempts = FIRST_ATTEMPT;
    this.finish({ context, startedAt: context.clock.now().getTime() }, outcome);
  }

  private async run<I, O>(tool: AgentTool<I, O>, input: I, context: TurnContext): Promise<O> {
    this.attempts = FIRST_ATTEMPT;
    const startedAt = context.clock.now().getTime();
    try {
      const parsedInput = tool.inputSchema.parse(input);
      const output = tool.outputSchema.parse(await tool.execute(parsedInput, context));
      const { stepKind: kind } = tool;
      const label = tool.stepLabel(parsedInput, output);
      const result = tool.stepResult(parsedInput, output);
      this.appliedRules.push(...(tool.rules?.(parsedInput, output) ?? []));
      this.finish({ context, startedAt }, { kind, label, result, status: 'ok' });
      return output;
    } catch (error: unknown) {
      const { stepKind: kind, failureLabel: label } = tool;
      const result = describeStepFailure(error, this.attempts);
      this.finish({ context, startedAt }, { kind, label, result, status: 'failed' });
      throw error;
    }
  }

  private finish(timing: { context: TurnContext; startedAt: number }, outcome: StepOutcome): void {
    const elapsedMs = timing.context.clock.now().getTime() - timing.startedAt;
    const step: AgentStep = {
      id: `${STEP_ID_PREFIX}${this.recorded.length + 1}`,
      ...outcome,
      attempts: this.attempts,
      durationMs: Math.max(0, elapsedMs),
    };
    this.recorded.push(step);
    timing.context.emit({ type: 'step', step });
  }
}
