import type { Understanding } from '@nexo/contracts';

export type ScenarioRun = {
  readonly userText: string;
  readonly match: RegExpMatchArray;
  callTool(name: string, input: unknown): Promise<unknown>;
};

export type Scenario = {
  readonly name: string;
  readonly trigger: RegExp;
  readonly understanding: Understanding;
  reply(run: ScenarioRun): Promise<string>;
};
