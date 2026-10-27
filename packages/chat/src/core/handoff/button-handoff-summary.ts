import type { AgentTurn, ChatMessage } from '@nexo/contracts';
import { collectTicketNumbers } from './collect-ticket-numbers.js';

const RECENT_AGENT_TURNS = 3;
const REQUEST_EXCERPT_MAX_LENGTH = 200;

export type ButtonHandoffSummary = {
  summary: string;
  ticketNumbers: string[];
  confidence: number | null;
};

function agentTurns(messages: readonly ChatMessage[]): AgentTurn[] {
  const turns = messages.flatMap((message) => (message.turn === null ? [] : [message.turn]));
  return turns.slice(-RECENT_AGENT_TURNS);
}

function lastEmployeeRequest(messages: readonly ChatMessage[]): string | null {
  const last = [...messages].reverse().find((message) => message.author === 'employee');
  return last === undefined ? null : last.text.slice(0, REQUEST_EXCERPT_MAX_LENGTH);
}

function stepLabels(turns: readonly AgentTurn[]): string[] {
  return [...new Set(turns.flatMap((turn) => turn.steps.map((step) => step.label)))];
}

function summarySentences(messages: readonly ChatMessage[], turns: readonly AgentTurn[]): string[] {
  const request = lastEmployeeRequest(messages);
  const labels = stepLabels(turns);
  const understood = turns.at(-1)?.decision.understood.summary;
  return [
    'O funcionário pediu para falar com um analista.',
    ...(request === null ? [] : [`Último pedido: "${request}".`]),
    ...(understood === undefined ? [] : [`Entendimento do agent: ${understood}.`]),
    ...(labels.length === 0 ? [] : [`O agent já ${labels.join(', ')}.`]),
  ];
}

export function buildButtonHandoffSummary(messages: readonly ChatMessage[]): ButtonHandoffSummary {
  const turns = agentTurns(messages);
  return {
    summary: summarySentences(messages, turns).join(' '),
    ticketNumbers: collectTicketNumbers(messages),
    confidence: turns.at(-1)?.decision.confidence.value ?? null,
  };
}
