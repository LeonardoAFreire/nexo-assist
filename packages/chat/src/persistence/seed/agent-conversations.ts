import { afterMinutes, ago, demoPersonByEmail, seedConversationId } from './seed-factories.js';
import type { SeedConversation } from './seed-factories.js';
import { buildScript, type ScriptLine } from './seed-script.js';

export const ACTIVE_AGENT_NUMBER = 1;
export const RESOLVED_BY_AGENT_NUMBER = 2;

const ACTIVE_AGENT_LINES: readonly ScriptLine[] = [
  {
    author: 'employee',
    text: 'Preciso de acesso à pasta de propostas do Comercial no SharePoint.',
    minutesAfterStart: 0,
  },
  {
    author: 'agent',
    text: 'Posso ajudar. Você já tentou pedir acesso pelo portal ou quer que eu abra uma solicitação?',
    minutesAfterStart: 1,
  },
  { author: 'employee', text: 'Ainda não tentei pelo portal.', minutesAfterStart: 3 },
];

const RESOLVED_LINES: readonly ScriptLine[] = [
  {
    author: 'employee',
    text: 'O Outlook do celular parou de sincronizar o e-mail.',
    minutesAfterStart: 0,
  },
  {
    author: 'agent',
    text: 'Remova a conta no aplicativo, adicione de novo e aguarde a sincronização inicial.',
    minutesAfterStart: 1,
  },
  { author: 'employee', text: 'Funcionou, obrigado!', minutesAfterStart: 9 },
];

export function buildActiveAgentConversation(now: Date): SeedConversation {
  const startedAt = ago(now, { minutes: 12 });
  const messages = buildScript({
    conversationNumber: ACTIVE_AGENT_NUMBER,
    startedAt,
    lines: ACTIVE_AGENT_LINES,
  });
  const employee = demoPersonByEmail('bruno.tavares@nexo.com.br');
  const conversation = {
    id: seedConversationId(ACTIVE_AGENT_NUMBER),
    employeeId: employee.id,
    state: 'agent' as const,
    resolution: null,
    assignedAnalystId: null,
    handoff: null,
    lastMessageAt: afterMinutes(startedAt, 3).toISOString(),
    analystReadAt: null,
    turnLockUntil: null,
    closedAt: null,
  };
  return { conversation, messages };
}

export function buildResolvedByAgentConversation(now: Date): SeedConversation {
  const startedAt = ago(now, { days: 2 });
  const messages = buildScript({
    conversationNumber: RESOLVED_BY_AGENT_NUMBER,
    startedAt,
    lines: RESOLVED_LINES,
  });
  const closedAt = afterMinutes(startedAt, 10).toISOString();
  const employee = demoPersonByEmail('diego.ramos@nexo.com.br');
  const conversation = {
    id: seedConversationId(RESOLVED_BY_AGENT_NUMBER),
    employeeId: employee.id,
    state: 'closed' as const,
    resolution: 'agent' as const,
    assignedAnalystId: null,
    handoff: null,
    lastMessageAt: afterMinutes(startedAt, 9).toISOString(),
    analystReadAt: null,
    turnLockUntil: null,
    closedAt,
  };
  return { conversation, messages };
}
