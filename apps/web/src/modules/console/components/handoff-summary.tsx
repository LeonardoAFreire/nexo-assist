import type { HandoffInfo, HandoffReason } from '@nexo/contracts';
import { formatConfidence } from '@/components/agent-turn/labels';
import { formatClockTime } from './format-clock-time.js';

const reasonLabels: Record<HandoffReason, string> = {
  requested: 'Pedido do funcionário',
  critical: 'Chamado crítico',
  overdue: 'Prazo vencido',
  low_confidence: 'Baixa confiança do agent',
  failure: 'Falha do agent',
};

type HandoffSummaryProps = {
  handoff: HandoffInfo;
};

function SummaryItem({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex gap-1.5 text-[13px]">
      <dt className="text-ink-3">{term}</dt>
      <dd className="font-medium text-ink-2">{value}</dd>
    </div>
  );
}

export function HandoffSummary({ handoff }: HandoffSummaryProps) {
  const confidence = handoff.confidence === null ? null : formatConfidence(handoff.confidence);
  return (
    <section
      aria-label="Resumo da transferência"
      className="rounded-2xl border border-rule bg-desk p-4"
    >
      <h2 className="text-sm font-semibold text-ink">Resumo da transferência</h2>
      <p className="mt-1.5 text-sm text-ink-2">{handoff.summary}</p>
      <dl className="mt-3 flex flex-col gap-1">
        <SummaryItem term="Motivo" value={reasonLabels[handoff.reason]} />
        <SummaryItem term="Nível" value={`Suporte ${handoff.level}`} />
        <SummaryItem term="Contato até" value={formatClockTime(handoff.contactDueAt)} />
        {confidence ? <SummaryItem term="Confiança" value={confidence} /> : null}
        {handoff.ticketNumbers.length > 0 ? (
          <SummaryItem term="Chamados" value={handoff.ticketNumbers.join(', ')} />
        ) : null}
      </dl>
    </section>
  );
}
