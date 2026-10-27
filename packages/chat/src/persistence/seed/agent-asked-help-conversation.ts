import type { ConversationProps } from '../../core/conversation/conversation-props.js';
import { afterMinutes, ago, demoPersonByEmail, seedConversationId } from './seed-factories.js';
import type { SeedConversation } from './seed-factories.js';
import { buildHandoff } from './seed-handoff.js';
import { buildScript, type ScriptLine } from './seed-script.js';

export const AGENT_ASKED_HELP_NUMBER = 4;

const HELP_LINES: readonly ScriptLine[] = [
  {
    author: 'employee',
    text: 'A VPN cai a cada dez minutos e já reiniciei o notebook duas vezes.',
    minutesAfterStart: 0,
  },
  {
    author: 'agent',
    text: 'Não tenho segurança para resolver isso sozinho. Encaminhei sua conversa para um analista.',
    minutesAfterStart: 2,
  },
];

export function buildAgentAskedHelpConversation(now: Date): SeedConversation {
  const startedAt = ago(now, { minutes: 35 });
  const messages = buildScript({
    conversationNumber: AGENT_ASKED_HELP_NUMBER,
    startedAt,
    lines: HELP_LINES,
  });
  const handoff = buildHandoff({
    handedOffAt: afterMinutes(startedAt, 2).toISOString(),
    reason: 'low_confidence',
    confidence: 0.42,
    summary: 'Carla relata quedas frequentes da VPN; o agent não teve segurança para orientar.',
    ticketNumbers: ['INC-20517'],
  });
  const conversation: ConversationProps = {
    id: seedConversationId(AGENT_ASKED_HELP_NUMBER),
    employeeId: demoPersonByEmail('carla.mendes@nexo.com.br').id,
    state: 'waiting_analyst',
    resolution: null,
    assignedAnalystId: null,
    handoff,
    lastMessageAt: handoff.handedOffAt,
    analystReadAt: null,
    turnLockUntil: null,
    closedAt: null,
  };
  return { conversation, messages };
}
