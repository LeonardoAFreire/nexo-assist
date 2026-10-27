import type { AgentApi, AgentTurnEvent, AgentTurnInput } from '@nexo/contracts';

const UNSCRIPTED_CALL_MESSAGE = 'O agent foi chamado sem um roteiro para este turno.';

export class ScriptedAgentApi implements AgentApi {
  readonly inputs: AgentTurnInput[] = [];
  private readonly scripts: AgentTurnEvent[][] = [];

  enqueue(events: AgentTurnEvent[]): void {
    this.scripts.push(events);
  }

  async *respond(input: AgentTurnInput): AsyncGenerator<AgentTurnEvent> {
    this.inputs.push(input);
    const script = this.scripts.shift();
    if (script === undefined) {
      throw new Error(UNSCRIPTED_CALL_MESSAGE);
    }
    yield* script;
  }
}
