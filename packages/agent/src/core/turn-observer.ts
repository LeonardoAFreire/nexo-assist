import type { AgentTurnEvent, TicketDraft } from '@nexo/contracts';

type HandoffRequest = Extract<AgentTurnEvent, { type: 'handoff-requested' }>;

export class TurnObserver {
  text = '';
  firstTokenMs: number | null = null;
  handoff: HandoffRequest | null = null;
  overdueShown = false;
  quickOptionsShown = false;
  criticalDraft: TicketDraft | null = null;
  private proposed = false;
  private resolvedByContent = false;

  watch(event: AgentTurnEvent, elapsedMs: number): void {
    if (event.type === 'text-delta') {
      this.text += event.delta;
      this.firstTokenMs ??= elapsedMs;
    }
    if (event.type === 'handoff-requested') {
      this.handoff = event;
    }
    if (event.type === 'part') {
      this.watchPart(event.part);
    }
    if (event.type === 'proposal') {
      this.proposed = true;
      this.criticalDraft = event.draft?.priority === 'critical' ? event.draft : this.criticalDraft;
    }
  }

  hasNextStep(): boolean {
    return (
      this.proposed || this.resolvedByContent || this.quickOptionsShown || this.handoff !== null
    );
  }

  private watchPart(part: Extract<AgentTurnEvent, { type: 'part' }>['part']): void {
    this.quickOptionsShown ||= part.type === 'quick_options';
    this.overdueShown ||= part.type === 'ticket_card' && part.ticket.overdue;
    this.resolvedByContent ||=
      part.type === 'ticket_card' ||
      part.type === 'ticket_selection' ||
      (part.type === 'article_citation' && part.applies);
  }
}
