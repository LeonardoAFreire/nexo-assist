import type { TicketDetail, TicketStatus, TicketSummary } from '@nexo/contracts';
import { formatElapsedDays, formatShortDateTime } from '@/lib/format-date-time';
import { cn } from '@/lib/utils';
import { CardBody, CardDescription, CardTitle } from './card-body.js';
import { CardEyebrow } from './card-eyebrow.js';
import { CardField, CardFields } from './card-fields.js';
import { CardShell } from './card-shell.js';
import { categoryLabels, OVERDUE_LABEL, statusLabels } from './labels.js';
import { PriorityValue } from './priority-value.js';
import { StatusDot } from './status-dot.js';
import { statusDotClass, statusTextClass } from './ticket-tones.js';

type TicketCardProps = {
  ticket: TicketSummary | TicketDetail;
};

function TicketState({ status }: { status: TicketStatus }) {
  return (
    <span className={cn('flex items-center gap-1.5 font-medium', statusTextClass[status])}>
      <StatusDot className={statusDotClass[status]} />
      {statusLabels[status]}
    </span>
  );
}

export function TicketCard({ ticket }: TicketCardProps) {
  const headingId = `ticket-${ticket.number}`;
  const state = <TicketState status={ticket.status} />;
  return (
    <CardShell labelledBy={headingId}>
      <CardBody eyebrow={<CardEyebrow kind="Chamado" reference={ticket.number} state={state} />}>
        <CardTitle id={headingId}>{ticket.title}</CardTitle>
        {'description' in ticket ? <CardDescription>{ticket.description}</CardDescription> : null}
      </CardBody>
      <CardFields>
        <CardField label="Categoria">{categoryLabels[ticket.category]}</CardField>
        <CardField label="Prioridade">
          <PriorityValue priority={ticket.priority} />
        </CardField>
        <CardField label="Aberto em">{formatShortDateTime(ticket.openedAt)}</CardField>
        <CardField label="Última atualização">
          <span className={cn('whitespace-nowrap', ticket.overdue && 'text-warning-text')}>
            {formatElapsedDays(ticket.lastUpdatedAt)}
          </span>
          {ticket.overdue ? (
            <span className="text-[13.5px] font-normal whitespace-nowrap text-ink-3">
              · {OVERDUE_LABEL}
            </span>
          ) : null}
        </CardField>
      </CardFields>
    </CardShell>
  );
}
