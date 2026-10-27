import { buildAgentAskedHelpConversation } from './agent-asked-help-conversation.js';
import { buildClosedByAnalystConversation } from './closed-by-analyst-conversation.js';
import {
  buildActiveAgentConversation,
  buildResolvedByAgentConversation,
} from './agent-conversations.js';
import type { SeedConversation } from './seed-factories.js';

export function buildConsoleSeed(now: Date): SeedConversation[] {
  return [
    buildActiveAgentConversation(now),
    buildResolvedByAgentConversation(now),
    buildClosedByAnalystConversation(now),
    buildAgentAskedHelpConversation(now),
  ];
}
