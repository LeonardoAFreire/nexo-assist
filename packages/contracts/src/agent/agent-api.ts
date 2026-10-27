import type { AgentTurnEvent } from './agent-turn-event.js';
import type { AgentTurnInput } from './agent-turn-input.js';

export const AGENT_API = Symbol('AGENT_API');

export interface AgentApi {
  respond(input: AgentTurnInput): AsyncIterable<AgentTurnEvent>;
}
