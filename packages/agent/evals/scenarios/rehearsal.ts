import type { AgentHistoryEntry, AgentIntent, UnderstandingEntities } from '@nexo/contracts';
import type {
  ScriptedEntry,
  ScriptedToolCall,
} from '../../src/persistence/scripted/scripted-llm-client.js';

const HIGH_CONFIDENCE = 0.9;
const AGENT_LABEL = 'Assistente Nexo';

const NO_ENTITIES: UnderstandingEntities = {
  ticketNumber: null,
  operatingSystem: null,
  symptom: null,
  impact: null,
  sameDayCommitment: null,
  hasWorkaround: null,
  blocksWork: null,
};

export type UnderstoodOptions = {
  entities?: Partial<UnderstandingEntities>;
  confidence?: number;
};

export function understood(
  intent: AgentIntent,
  summary: string,
  options: UnderstoodOptions = {},
): ScriptedEntry {
  return {
    type: 'understand',
    understanding: {
      intent,
      summary,
      entities: { ...NO_ENTITIES, ...options.entities },
      confidence: options.confidence ?? HIGH_CONFIDENCE,
      reason: 'roteiro de ensaio',
    },
  };
}

export function replies(text: string, toolCalls: ScriptedToolCall[] = []): ScriptedEntry {
  return { type: 'respond', text, toolCalls };
}

export function employeeSays(authorLabel: string, text: string): AgentHistoryEntry {
  return { author: 'employee', authorLabel, text, parts: [] };
}

export function agentSays(text: string): AgentHistoryEntry {
  return { author: 'agent', authorLabel: AGENT_LABEL, text, parts: [] };
}
