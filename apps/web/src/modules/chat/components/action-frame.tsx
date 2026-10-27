import type { PendingAction } from '@nexo/contracts';
import type { ReactNode, Ref } from 'react';
import { useChatActions } from '../hooks/chat-actions-context.js';
import { useConfirmShortcut } from '../hooks/use-confirm-shortcut.js';
import type { PendingActionApi } from '../hooks/use-pending-action.js';
import { ActionButtons } from './action-buttons.js';
import { actionTitle } from './action-title.js';

type ActionFrameProps = {
  action: PendingAction;
  api: PendingActionApi;
  onEdit: (() => void) | null;
  editButtonRef?: Ref<HTMLButtonElement>;
  children: ReactNode;
};

function ActionHeader({ title }: { title: string }) {
  return (
    <header className="flex flex-wrap items-center gap-2">
      <span className="text-[13px] font-semibold text-ink-2">{title}</span>
      <span className="rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-medium text-ink-2">
        Aguardando confirmação
      </span>
    </header>
  );
}

export function ActionFrame({ action, api, onEdit, editButtonRef, children }: ActionFrameProps) {
  const { busy } = useChatActions();
  const disabled = busy || api.isPending;
  useConfirmShortcut(!disabled, () => api.confirm('shortcut'));
  const title = actionTitle(action);
  return (
    <article
      aria-label={title}
      aria-busy={api.isPending}
      className="flex max-w-[600px] flex-col gap-3 rounded-2xl border border-primary/30 bg-paper p-4 shadow-sm"
    >
      <ActionHeader title={title} />
      {children}
      <ActionButtons
        disabled={disabled}
        onConfirm={() => api.confirm('button')}
        onCancel={api.cancel}
        onEdit={onEdit}
        editButtonRef={editButtonRef}
      />
      {api.errorMessage ? (
        <p role="alert" className="text-sm text-destructive">
          {api.errorMessage}
        </p>
      ) : null}
    </article>
  );
}
