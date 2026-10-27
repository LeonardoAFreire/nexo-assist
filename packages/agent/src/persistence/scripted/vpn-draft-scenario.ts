import type { Scenario } from './scenario.js';
import { understandingOf } from './scenario-understanding.js';
import { BLOCKED_ANSWER } from './vpn-triage-scenarios.js';

const PRIORITY_FACTS = {
  impact: 'only_me',
  blocksWork: true,
  sameDayCommitment: false,
  hasWorkaround: false,
  kind: 'incident',
};

const TICKET_DRAFT = {
  title: 'VPN com erro 809 no Windows 11',
  description:
    'Erro 809 ao conectar na VPN em um notebook com Windows 11. O funcionário não consegue trabalhar remotamente.',
  type: 'incident',
  category: 'network_vpn',
  affected: 'only_me',
  priorityFacts: PRIORITY_FACTS,
};

export const vpnDraftScenario: Scenario = {
  name: 'vpn-rascunho-do-chamado',
  trigger: new RegExp(`^${BLOCKED_ANSWER}$`),
  understanding: understandingOf({
    intent: 'ticket_open',
    summary: 'Funcionário não consegue trabalhar por causa do erro 809 na VPN',
    entities: { impact: 'only_me', blocksWork: true, hasWorkaround: false },
  }),
  async reply(run) {
    await run.callTool('classificar_prioridade', PRIORITY_FACTS);
    await run.callTool('propor_chamado', TICKET_DRAFT);
    return 'Montei o rascunho do chamado. Confira os dados e confirme para eu abrir.';
  },
};
