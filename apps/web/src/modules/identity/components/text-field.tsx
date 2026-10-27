import { Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { FieldFrame } from './field-frame.js';

type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export function TextField({ label, value, onChange }: TextFieldProps) {
  return (
    <FieldFrame inputId="email" label={label} icon={<Mail />}>
      <Input
        id="email"
        type="email"
        autoComplete="username"
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-full flex-1 border-0 bg-transparent px-0 text-[14.5px] shadow-none focus-visible:ring-0 dark:bg-transparent"
      />
    </FieldFrame>
  );
}
