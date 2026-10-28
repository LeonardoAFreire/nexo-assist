import type { ConsoleEmployeeTickets } from '@nexo/contracts';
import { Button } from '@/components/ui/button';
import { useConsoleConversation } from '../hooks/use-console-conversation.js';
import { useEmployeeTickets } from '../hooks/use-employee-tickets.js';
import { attendanceModeOf } from './attendance-mode.js';
import { EmployeeTicketsContent } from './employee-tickets-content.js';

const RESTRICTED_MESSAGE =
  'Os chamados ficam disponíveis quando a conversa é transferida para você.';
const ERROR_MESSAGE = 'Não foi possível carregar os chamados do funcionário.';
const ACCESS_MODES = ['claimable', 'mine'];

type EmployeeTicketsPanelProps = {
  conversationId: string;
  analystId: string;
};

function PanelError({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-2">
      <p className="text-[13px] text-destructive">{ERROR_MESSAGE}</p>
      <Button variant="outline" onClick={onRetry}>
        Tentar novamente
      </Button>
    </div>
  );
}

function countsOf(tickets: ConsoleEmployeeTickets | undefined): string {
  if (!tickets) {
    return '';
  }
  const open = tickets.fromConversation.length + tickets.others.open.length;
  return `${open} abertos · ${tickets.others.closed.length} encerrados`;
}

export function EmployeeTicketsPanel({ conversationId, analystId }: EmployeeTicketsPanelProps) {
  const detail = useConsoleConversation(conversationId).data;
  const mode = detail ? attendanceModeOf(detail.conversation, analystId) : null;
  const allowed = mode !== null && ACCESS_MODES.includes(mode);
  const query = useEmployeeTickets(conversationId, allowed);
  const firstName = detail?.conversation.employee.name.split(' ')[0] ?? 'funcionário';
  return (
    <aside
      aria-label="Chamados do funcionário"
      className="flex w-85 shrink-0 flex-col overflow-y-auto border-l border-rule bg-paper"
    >
      <header className="flex h-16 shrink-0 flex-col justify-center gap-0.5 border-b border-rule pr-3.5 pl-5">
        <h2 className="text-[15.5px] font-semibold text-ink">Chamados da {firstName}</h2>
        <p className="text-[12.5px] text-ink-3">{countsOf(query.data)}</p>
      </header>
      <div className="flex flex-col gap-8 px-5 pt-6 pb-5">
        {query.isPending && allowed ? (
          <output className="text-[13px] text-ink-3">Carregando chamados…</output>
        ) : null}
        {mode !== null && !allowed ? (
          <p className="text-[13px] text-ink-3">{RESTRICTED_MESSAGE}</p>
        ) : null}
        {query.isError ? <PanelError onRetry={() => void query.refetch()} /> : null}
        {query.data && !query.isError ? <EmployeeTicketsContent tickets={query.data} /> : null}
      </div>
    </aside>
  );
}
