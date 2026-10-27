import type { PendingAction, TicketDraft } from '@nexo/contracts';
import { useState } from 'react';
import { usePendingAction } from '../hooks/use-pending-action.js';
import { ActionFrame } from './action-frame.js';
import { DraftEditForm } from './draft-edit-form.js';
import { DraftFields } from './draft-fields.js';

type DraftCardProps = {
  action: PendingAction;
  draft: TicketDraft;
};

export function DraftCard({ action, draft }: DraftCardProps) {
  const api = usePendingAction(action);
  const [editing, setEditing] = useState(false);
  if (editing) {
    return (
      <DraftEditForm action={action} draft={draft} api={api} onClose={() => setEditing(false)} />
    );
  }
  return (
    <ActionFrame action={action} api={api} onEdit={() => setEditing(true)}>
      <DraftFields draft={draft} />
    </ActionFrame>
  );
}
