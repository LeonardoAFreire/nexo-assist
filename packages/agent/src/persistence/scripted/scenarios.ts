import { analystRequestScenario } from './analyst-request-scenario.js';
import type { Scenario } from './scenario.js';
import { ticketLookupScenario } from './ticket-lookup-scenario.js';
import { vpnDraftScenario } from './vpn-draft-scenario.js';
import {
  vpnAffectedScenario,
  vpnReportScenario,
  vpnWindowsScenario,
} from './vpn-triage-scenarios.js';

export const SCENARIOS: readonly Scenario[] = [
  vpnReportScenario,
  vpnWindowsScenario,
  vpnAffectedScenario,
  vpnDraftScenario,
  analystRequestScenario,
  ticketLookupScenario,
];
