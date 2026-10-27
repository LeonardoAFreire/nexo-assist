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

export function EmployeeTicketsPanel({ conversationId, analystId }: EmployeeTicketsPanelProps) {
  const detail = useConsoleConversation(conversationId).data;
  const mode = detail ? attendanceModeOf(detail.conversation, analystId) : null;
  const allowed = mode !== null && ACCESS_MODES.includes(mode);
  const query = useEmployeeTickets(conversationId, allowed);
  return (
    <aside
      aria-label="Chamados do funcionário"
      className="flex w-85 shrink-0 flex-col gap-4 overflow-y-auto border-l border-rule p-4"
    >
      <h2 className="text-[15px] font-semibold text-ink">Chamados do funcionário</h2>
      {query.isPending && allowed ? (
        <output className="text-[13px] text-ink-3">Carregando chamados…</output>
      ) : null}
      {mode !== null && !allowed ? (
        <p className="text-[13px] text-ink-3">{RESTRICTED_MESSAGE}</p>
      ) : null}
      {query.isError ? (
        <div role="alert" className="flex flex-col items-start gap-2">
          <p className="text-[13px] text-destructive">{ERROR_MESSAGE}</p>
          <Button variant="outline" onClick={() => void query.refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : null}
      {query.data && !query.isError ? <EmployeeTicketsContent tickets={query.data} /> : null}
    </aside>
  );
}
