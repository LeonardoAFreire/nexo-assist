import type { Ref } from 'react';
import { Button } from '@/components/ui/button';

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
      className="h-9"
    >
      Editar
    </Button>
  );
}

export function ActionButtons(props: ActionButtonsProps) {
  const { disabled, onConfirm, onCancel, onEdit, editButtonRef } = props;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        disabled={disabled}
        aria-keyshortcuts="Control+Enter Meta+Enter"
        onClick={onConfirm}
        className="h-9 bg-cta px-4"
      >
        Confirmar
        <kbd aria-hidden="true" className="text-[11px] font-normal opacity-80">
          Ctrl+Enter
        </kbd>
      </Button>
      {onEdit ? <EditButton disabled={disabled} onEdit={onEdit} buttonRef={editButtonRef} /> : null}
      <Button type="button" variant="ghost" disabled={disabled} onClick={onCancel} className="h-9">
        Cancelar
      </Button>
    </div>
  );
}
