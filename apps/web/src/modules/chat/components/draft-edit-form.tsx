import type { EditPendingActionRequest, PendingAction, TicketDraft } from '@nexo/contracts';
import { Button } from '@/components/ui/button';
import { useDraftForm } from '../hooks/use-draft-form.js';
import type { PendingActionApi } from '../hooks/use-pending-action.js';
import { actionTitle } from './action-title.js';
import { DraftEditFields } from './draft-edit-fields.js';

type DraftEditFormProps = {
  action: PendingAction;
  draft: TicketDraft;
  api: PendingActionApi;
  onClose: () => void;
};

export function DraftEditForm({ action, draft, api, onClose }: DraftEditFormProps) {
  const onSave = (changes: EditPendingActionRequest) => api.edit(changes, onClose);
  const form = useDraftForm({ draft, onSave, onClose });
  return (
    <form
      aria-label={`Editar ${actionTitle(action)}`}
      onSubmit={form.submit}
      className="flex max-w-[600px] flex-col gap-3 rounded-2xl border border-primary/30 bg-paper p-4 shadow-sm"
    >
      <DraftEditFields form={form} />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={api.isPending} className="h-9 bg-cta px-4">
          Salvar
        </Button>
        <Button type="button" variant="ghost" onClick={onClose} className="h-9">
          Cancelar edição
        </Button>
      </div>
      {api.errorMessage ? (
        <p role="alert" className="text-sm text-destructive">
          {api.errorMessage}
        </p>
      ) : null}
    </form>
  );
}
