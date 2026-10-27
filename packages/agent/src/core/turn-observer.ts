import type { AgentTurnEvent, TicketDraft } from '@nexo/contracts';

type HandoffRequest = Extract<AgentTurnEvent, { type: 'handoff-requested' }>;

export class TurnObserver {
  text = '';
  firstTokenMs: number | null = null;
  handoff: HandoffRequest | null = null;
  overdueShown = false;
  criticalDraft: TicketDraft | null = null;

  watch(event: AgentTurnEvent, elapsedMs: number): void {
    if (event.type === 'text-delta') {
      this.text += event.delta;
      this.firstTokenMs ??= elapsedMs;
    }
    if (event.type === 'handoff-requested') {
      this.handoff = event;
    }
    if (event.type === 'part' && event.part.type === 'ticket_card' && event.part.ticket.overdue) {
      this.overdueShown = true;
    }
    if (event.type === 'proposal' && event.draft?.priority === 'critical') {
      this.criticalDraft = event.draft;
    }
  }
}
