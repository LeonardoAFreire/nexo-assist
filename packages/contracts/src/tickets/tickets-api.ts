import type { DuplicateCheck } from './duplicate-check.js';
import type { PriorityAssessment } from './priority-assessment.js';
import type { PriorityFacts } from './priority-facts.js';
import type { TicketCategory } from './ticket-category.js';
import type { TicketDetail } from './ticket-detail.js';
import type { TicketDraft } from './ticket-draft.js';
import type { TicketScope } from './ticket-scope.js';
import type { TicketSummary } from './ticket-summary.js';

export const TICKETS_API = Symbol('TICKETS_API');

type Owner = { requesterId: string };
type Idempotent = { idempotencyKey: string };

export interface TicketsApi {
  listOwn(input: Owner & { scope: TicketScope }): Promise<TicketSummary[]>;
  findOwn(input: Owner & { number: string }): Promise<TicketDetail | null>;
  searchOwn(input: Owner & { query: string }): Promise<TicketSummary[]>;
  findDuplicates(
    input: Owner & { category: TicketCategory; text: string },
  ): Promise<DuplicateCheck>;
  assessPriority(facts: PriorityFacts): Promise<PriorityAssessment>;
  contactDeadline(input: { from: string; critical: boolean }): Promise<string>;
  create(input: Owner & Idempotent & { draft: TicketDraft }): Promise<TicketDetail>;
  complement(input: Owner & Idempotent & { number: string; text: string }): Promise<TicketDetail>;
  reopen(input: Owner & Idempotent & { number: string; reason: string }): Promise<TicketDetail>;
}
