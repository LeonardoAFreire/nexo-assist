import type { ConversationProps } from '../../core/conversation/conversation-props.js';
import { afterMinutes, ago, demoPersonByEmail, seedConversationId } from './seed-factories.js';
import type { SeedConversation } from './seed-factories.js';
import { buildHandoff } from './seed-handoff.js';
import { buildScript, type ScriptLine } from './seed-script.js';

export const CLOSED_BY_ANALYST_NUMBER = 3;

const CLOSED_LINES: readonly ScriptLine[] = [
  {
    author: 'employee',
    text: 'Quero falar com um analista sobre meu acesso ao sistema financeiro.',
    minutesAfterStart: 0,
  },
  {
    author: 'analyst',
    text: 'Oi, Ana. Liberei o perfil de consulta. Pode testar?',
    minutesAfterStart: 20,
    authorName: 'Gabriela Rocha',
    authorLevel: 'N1',
  },
  { author: 'employee', text: 'Consegui entrar, obrigada.', minutesAfterStart: 27 },
];

export function buildClosedByAnalystConversation(now: Date): SeedConversation {
  const startedAt = ago(now, { days: 4 });
  const messages = buildScript({
    conversationNumber: CLOSED_BY_ANALYST_NUMBER,
    startedAt,
    lines: CLOSED_LINES,
  });
  const handoff = buildHandoff({
    handedOffAt: startedAt.toISOString(),
    summary: 'Ana pediu um analista para liberar o acesso ao sistema financeiro.',
    ticketNumbers: ['INC-20150'],
  });
  const conversation: ConversationProps = {
    id: seedConversationId(CLOSED_BY_ANALYST_NUMBER),
    employeeId: demoPersonByEmail('ana.souza@nexo.com.br').id,
    state: 'closed',
    resolution: 'analyst',
    assignedAnalystId: demoPersonByEmail('gabriela.rocha@nexo.com.br').id,
    handoff,
    lastMessageAt: afterMinutes(startedAt, 27).toISOString(),
    analystReadAt: afterMinutes(startedAt, 28).toISOString(),
    turnLockUntil: null,
    closedAt: afterMinutes(startedAt, 30).toISOString(),
  };
  return { conversation, messages };
}
