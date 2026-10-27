import { millisecondsText, usdText, verdictText } from '../format.js';
import {
  CONVERSATION_COST_TARGET_USD,
  FIRST_TOKEN_P50_TARGET_MS,
  FIRST_TOKEN_P95_TARGET_MS,
} from '../goal-targets.js';
import type { ModelUsage, RunReport } from './build-run-report.js';

function outcomeLine([outcome, count]: [string, number]): string {
  return `  ${outcome}: ${count}`;
}

function modelLine(usage: ModelUsage): string {
  return `  ${usage.models}: ${usage.runs} execuções, ${usdText(usage.averageCostUsd)} por execução`;
}

function isWithin(value: number | null, target: number): boolean {
  return value !== null && value <= target;
}

export function renderRunReport(report: RunReport): string {
  const { firstTokenP50Ms: p50, firstTokenP95Ms: p95 } = report;
  const costMet = report.averageCostPerConversationUsd <= CONVERSATION_COST_TARGET_USD;
  return [
    `Execuções do agent: ${report.runs} em ${report.conversations} conversas`,
    `Primeiro trecho p50: ${millisecondsText(p50)} (meta ${FIRST_TOKEN_P50_TARGET_MS} ms): ${verdictText(isWithin(p50, FIRST_TOKEN_P50_TARGET_MS))}`,
    `Primeiro trecho p95: ${millisecondsText(p95)} (meta ${FIRST_TOKEN_P95_TARGET_MS} ms): ${verdictText(isWithin(p95, FIRST_TOKEN_P95_TARGET_MS))}`,
    `Custo médio por conversa: ${usdText(report.averageCostPerConversationUsd)} (meta ${usdText(CONVERSATION_COST_TARGET_USD)}): ${verdictText(costMet)}`,
    `Custo médio por execução: ${usdText(report.averageCostPerRunUsd)}`,
    'Desfechos:',
    ...Object.entries(report.outcomes).map(outcomeLine),
    'Por modelo:',
    ...report.byModel.map(modelLine),
    '',
  ].join('\n');
}
