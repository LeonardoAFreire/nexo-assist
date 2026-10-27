import type { AgentIntent, Understanding, UnderstandingEntities } from '@nexo/contracts';

const SCENARIO_CONFIDENCE = 0.95;
const SCENARIO_REASON = 'entendimento definido pelo roteiro do cenário';

const NO_ENTITIES: UnderstandingEntities = {
  ticketNumber: null,
  operatingSystem: null,
  symptom: null,
  impact: null,
  sameDayCommitment: null,
  hasWorkaround: null,
  blocksWork: null,
};

export type ScenarioUnderstanding = {
  intent: AgentIntent;
  summary: string;
  entities?: Partial<UnderstandingEntities>;
};

export function understandingOf(input: ScenarioUnderstanding): Understanding {
  return {
    intent: input.intent,
    summary: input.summary,
    entities: { ...NO_ENTITIES, ...input.entities },
    confidence: SCENARIO_CONFIDENCE,
    reason: SCENARIO_REASON,
  };
}
