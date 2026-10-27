import type { Understanding } from '@nexo/contracts';
import type { LlmClient, LlmResult, RespondInput, UnderstandInput } from '../../core/llm-client.js';
import type { LlmEvent } from '../../core/llm-event.js';
import type { TokenUsage } from '../../core/token-usage.js';
import type { Scenario, ScenarioRun } from './scenario.js';
import { lastEmployeeText } from './scenario-user-text.js';
import { UnscriptedLlmCallError } from './scripted-llm-client.js';

const NO_USAGE: TokenUsage = { inputTokens: 0, outputTokens: 0 };
const WORD_WITH_TRAILING_SPACE = /\S+\s*/g;

type PickedScenario = { scenario: Scenario; userText: string; match: RegExpMatchArray };

function toolCaller(input: RespondInput): ScenarioRun['callTool'] {
  return async (name, toolInput) => {
    const tool = input.tools.find((candidate) => candidate.name === name);
    if (!tool) {
      throw new UnscriptedLlmCallError(`ferramenta ${name} não oferecida neste turno`);
    }
    return tool.execute(toolInput, input.context);
  };
}

export class ScenarioLlmClient implements LlmClient {
  constructor(private readonly scenarios: readonly Scenario[]) {}

  async understand(input: UnderstandInput): Promise<LlmResult<Understanding>> {
    const { scenario } = this.pick(input);
    return { value: scenario.understanding, usage: NO_USAGE };
  }

  async *respond(input: RespondInput): AsyncIterable<LlmEvent> {
    const { scenario, userText, match } = this.pick(input);
    const text = await scenario.reply({ userText, match, callTool: toolCaller(input) });
    for (const delta of text.match(WORD_WITH_TRAILING_SPACE) ?? []) {
      input.signal.throwIfAborted();
      yield { type: 'text-delta', delta };
    }
    yield { type: 'finished', usage: NO_USAGE };
  }

  private pick(input: UnderstandInput): PickedScenario {
    const userText = lastEmployeeText(input.messages);
    for (const scenario of this.scenarios) {
      const match = scenario.trigger.exec(userText);
      if (match) {
        return { scenario, userText, match };
      }
    }
    throw new UnscriptedLlmCallError('nenhum cenário atende à mensagem do funcionário');
  }
}
