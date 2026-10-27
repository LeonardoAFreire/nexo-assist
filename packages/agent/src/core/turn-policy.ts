import type { Understanding } from '@nexo/contracts';
import type { AgentTool } from './agent-tool.js';
import type { TurnRoute } from './turn-route.js';

export class TurnPolicy {
  constructor(private readonly confidenceThreshold: number) {}

  decide(understanding: Understanding): TurnRoute {
    if (understanding.intent === 'analyst_request') {
      return { kind: 'handoff', reason: 'requested' };
    }
    if (understanding.confidence < this.confidenceThreshold) {
      return { kind: 'handoff', reason: 'low_confidence' };
    }
    return understanding.intent === 'out_of_scope' ? { kind: 'redirect' } : { kind: 'respond' };
  }

  toolsFor(route: TurnRoute, tools: AgentTool[]): AgentTool[] {
    return route.kind === 'respond' ? [...tools] : [];
  }
}
