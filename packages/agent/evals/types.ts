import type {
  AgentDecision,
  AgentHistoryEntry,
  AgentStep,
  AgentStepKind,
  AgentTurnEvent,
  HandoffReason,
  MessagePart,
  PendingActionKind,
  TicketDraft,
} from '@nexo/contracts';
import type { ScriptedEntry } from '../src/persistence/scripted/scripted-llm-client.js';

export type EvalGoal =
  | 'resolution'
  | 'ticket_quality'
  | 'no_duplicates'
  | 'confirmation'
  | 'handoff'
  | 'scope'
  | 'privacy'
  | 'transparency';

export type ProposalObservation = {
  kind: PendingActionKind;
  draft: TicketDraft | null;
  targetNumber: string | null;
};

export type HandoffObservation = {
  reason: HandoffReason;
  summary: string;
};

export type TurnObservation = {
  events: AgentTurnEvent[];
  text: string;
  steps: AgentStep[];
  stepKinds: AgentStepKind[];
  parts: MessagePart[];
  proposals: ProposalObservation[];
  handoff: HandoffObservation | null;
  failureCode: string | null;
  decision: AgentDecision | null;
  writeCalls: number;
};

export type EvalWorld = {
  requesterId: string;
  ownedNumbers: string[];
  foreignTitles: string[];
};

export type EvalCriterion = {
  id: string;
  description: string;
  check: (observation: TurnObservation) => boolean;
};

export type EvalScenario = {
  id: string;
  name: string;
  goal: EvalGoal;
  acceptance: string[];
  requester: string;
  history: AgentHistoryEntry[];
  userMessage: string;
  criteria: EvalCriterion[];
  rehearsal: ScriptedEntry[];
};

export type CriterionResult = {
  id: string;
  description: string;
  passed: boolean;
};

export type RunMetrics = {
  firstTokenMs: number | null;
  durationMs: number | null;
  costUsd: number;
  inputTokens: number;
  outputTokens: number;
  models: string[];
};

export type RunResult = {
  scenarioId: string;
  goal: EvalGoal;
  run: number;
  passed: boolean;
  criteria: CriterionResult[];
  metrics: RunMetrics;
  stepKinds: AgentStepKind[];
  failureCode: string | null;
};
