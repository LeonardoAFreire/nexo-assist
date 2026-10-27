import type { AgentStepKind } from '@nexo/contracts';
import type { z } from 'zod';
import type { TurnContext } from './turn-context.js';

export interface AgentTool<I = unknown, O = unknown> {
  readonly name: string;
  readonly description: string;
  readonly stepKind: AgentStepKind;
  readonly failureLabel: string;
  readonly inputSchema: z.ZodType<I>;
  readonly outputSchema: z.ZodType<O>;
  stepLabel(input: I, output: O): string;
  stepResult(input: I, output: O): string;
  rules?(input: I, output: O): string[];
  execute(input: I, context: TurnContext): Promise<O>;
}
