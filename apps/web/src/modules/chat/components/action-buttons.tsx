import type { Ref } from 'react';
import { Button } from '@/components/ui/button';
import { confirmShortcutLabel } from '@/lib/confirm-shortcut-label';

type ActionButtonsProps = {
  disabled: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onEdit: (() => void) | null;
  editButtonRef?: Ref<HTMLButtonElement>;
};

type EditButtonProps = {
  disabled: boolean;
  onEdit: () => void;
  buttonRef?: Ref<HTMLButtonElement>;
};

function EditButton({ disabled, onEdit, buttonRef }: EditButtonProps) {
  return (
    <Button
      ref={buttonRef}
      type="button"
      variant="outline"
      disabled={disabled}
      onClick={onEdit}
      className="h-9 rounded-lg border-ink/12 bg-paper px-3.5 text-[13.5px] font-medium text-ink shadow-[0_1px_2px_#1b24310d]"
    >
      Editar
    </Button>
  );
}

function ConfirmButton({ disabled, onConfirm }: { disabled: boolean; onConfirm: () => void }) {
  return (
    <Button
      type="button"
      disabled={disabled}
      aria-keyshortcuts="Control+Enter Meta+Enter"
      onClick={onConfirm}
      className="h-9 gap-2 rounded-lg bg-cta pr-2.5 pl-3.5 text-[13.5px] font-semibold text-white"
    >
      Confirmar
      <kbd
        aria-hidden="true"
        className="rounded-md bg-white/14 px-[5px] py-px text-[11.5px] font-normal text-white/80"
      >
        {confirmShortcutLabel()}
      </kbd>
    </Button>
  );
}

export function ActionButtons(props: ActionButtonsProps) {
  const { disabled, onConfirm, onCancel, onEdit, editButtonRef } = props;
  return (
    <div className="flex flex-wrap items-center gap-1.5 border-t border-rule bg-desk py-2 pr-3.5 pl-2">
      <ConfirmButton disabled={disabled} onConfirm={onConfirm} />
      {onEdit ? <EditButton disabled={disabled} onEdit={onEdit} buttonRef={editButtonRef} /> : null}
      <Button
        type="button"
        variant="ghost"
        disabled={disabled}
        onClick={onCancel}
        className="h-9 rounded-lg px-3.5 text-[13.5px] font-medium text-ink-2"
      >
        Cancelar
      </Button>
    </div>
  );
}
