import { average, percentile } from '../percentile.js';

const MEDIAN_RATIO = 0.5;
const P95_RATIO = 0.95;
const MODEL_SEPARATOR = ' + ';
const UNKNOWN_MODEL = 'desconhecido';

export type RunRow = {
  conversationId: string;
  firstTokenMs: number | null;
  costUsd: number;
  durationMs: number;
  outcome: string;
  models: string[];
};

export type ModelUsage = {
  models: string;
  runs: number;
  averageCostUsd: number;
};

export type RunReport = {
  runs: number;
  conversations: number;
  firstTokenP50Ms: number | null;
  firstTokenP95Ms: number | null;
  averageCostPerConversationUsd: number;
  averageCostPerRunUsd: number;
  outcomes: Record<string, number>;
  byModel: ModelUsage[];
};

function costPerConversation(rows: RunRow[]): number[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    totals.set(row.conversationId, (totals.get(row.conversationId) ?? 0) + row.costUsd);
  }
  return [...totals.values()];
}

function countOutcomes(rows: RunRow[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.outcome] = (counts[row.outcome] ?? 0) + 1;
  }
  return counts;
}

function usageByModel(rows: RunRow[]): ModelUsage[] {
  const keys = [...new Set(rows.map((row) => row.models.join(MODEL_SEPARATOR) || UNKNOWN_MODEL))];
  return keys.map((models) => {
    const matching = rows.filter(
      (row) => (row.models.join(MODEL_SEPARATOR) || UNKNOWN_MODEL) === models,
    );
    return {
      models,
      runs: matching.length,
      averageCostUsd: average(matching.map((row) => row.costUsd)),
    };
  });
}

export function buildRunReport(rows: RunRow[]): RunReport {
  const firstTokens = rows.flatMap((row) => row.firstTokenMs ?? []);
  const conversationCosts = costPerConversation(rows);
  return {
    runs: rows.length,
    conversations: conversationCosts.length,
    firstTokenP50Ms: percentile(firstTokens, MEDIAN_RATIO),
    firstTokenP95Ms: percentile(firstTokens, P95_RATIO),
    averageCostPerConversationUsd: average(conversationCosts),
    averageCostPerRunUsd: average(rows.map((row) => row.costUsd)),
    outcomes: countOutcomes(rows),
    byModel: usageByModel(rows),
  };
}
