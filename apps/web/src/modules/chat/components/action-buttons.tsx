import { Button } from '@/components/ui/button';

type ActionButtonsProps = {
  disabled: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onEdit: (() => void) | null;
};

type EditButtonProps = {
  disabled: boolean;
  onEdit: () => void;
};

function EditButton({ disabled, onEdit }: EditButtonProps) {
  return (
    <Button type="button" variant="outline" disabled={disabled} onClick={onEdit} className="h-9">
      Editar
    </Button>
  );
}

export function ActionButtons({ disabled, onConfirm, onCancel, onEdit }: ActionButtonsProps) {
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
      {onEdit ? <EditButton disabled={disabled} onEdit={onEdit} /> : null}
      <Button type="button" variant="ghost" disabled={disabled} onClick={onCancel} className="h-9">
        Cancelar
      </Button>
    </div>
  );
}
