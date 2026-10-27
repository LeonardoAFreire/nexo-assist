import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

type RememberFieldProps = {
  checked: boolean;
  onChange: (value: boolean) => void;
};

export function RememberField({ checked, onChange }: RememberFieldProps) {
  return (
    <div className="flex items-center gap-[9px] pt-0.5">
      <Checkbox
        id="remember"
        checked={checked}
        onCheckedChange={(state: boolean | 'indeterminate') => onChange(state === true)}
      />
      <Label htmlFor="remember" className="text-[13.5px] font-normal text-ink-2">
        Manter conectado neste computador
      </Label>
    </div>
  );
}
