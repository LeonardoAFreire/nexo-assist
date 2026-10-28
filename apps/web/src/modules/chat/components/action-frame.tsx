import type { PendingAction } from '@nexo/contracts';
import type { ReactNode, Ref } from 'react';
import { CardBody } from '@/components/tickets/card-body';
import { CardEyebrow } from '@/components/tickets/card-eyebrow';
import { CardShell } from '@/components/tickets/card-shell';
import { StatusDot } from '@/components/tickets/status-dot';
import { useChatActions } from '../hooks/chat-actions-context.js';
import { useConfirmShortcut } from '../hooks/use-confirm-shortcut.js';
import type { PendingActionApi } from '../hooks/use-pending-action.js';
import { ActionButtons } from './action-buttons.js';
import { actionTitle } from './action-title.js';
import { pendingKindNames } from './affected-labels.js';

type ActionFrameProps = {
  action: PendingAction;
  api: PendingActionApi;
  onEdit: (() => void) | null;
  editButtonRef?: Ref<HTMLButtonElement>;
  fields?: ReactNode;
  children: ReactNode;
};

function AwaitingConfirmation() {
  return (
    <span className="flex items-center gap-1.5 font-medium text-warning-text">
      <StatusDot className="bg-warning" />
      Aguardando confirmação
    </span>
  );
}

export function ActionFrame(props: ActionFrameProps) {
  const { action, api, onEdit, editButtonRef, fields, children } = props;
  const { busy } = useChatActions();
  const disabled = busy || api.isPending;
  useConfirmShortcut(!disabled, () => api.confirm('shortcut'));
  const title = actionTitle(action);
  const kind = pendingKindNames[action.kind];
  const eyebrow = <CardEyebrow kind={kind} reference={title} state={<AwaitingConfirmation />} />;
  return (
    <CardShell label={title} busy={api.isPending}>
      <CardBody eyebrow={eyebrow}>{children}</CardBody>
      {fields}
      <ActionButtons
        disabled={disabled}
        onConfirm={() => api.confirm('button')}
        onCancel={api.cancel}
        onEdit={onEdit}
        editButtonRef={editButtonRef}
      />
      {api.errorMessage ? (
        <p role="alert" className="px-[18px] py-2 text-sm text-destructive">
          {api.errorMessage}
        </p>
      ) : null}
    </CardShell>
  );
}
