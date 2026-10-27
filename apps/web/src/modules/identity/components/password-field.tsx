import { Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldFrame } from './field-frame.js';

type PasswordFieldProps = {
  value: string;
  onChange: (value: string) => void;
};

export function PasswordField({ value, onChange }: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);
  const toggle = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={isVisible ? 'Ocultar senha' : 'Mostrar senha'}
      aria-pressed={isVisible}
      onClick={() => setIsVisible((current: boolean) => !current)}
      className="text-ink-3 [&_svg]:size-4"
    >
      {isVisible ? <EyeOff /> : <Eye />}
    </Button>
  );
  return (
    <FieldFrame inputId="password" label="Senha" icon={<LockKeyhole />} trailing={toggle}>
      <Input
        id="password"
        type={isVisible ? 'text' : 'password'}
        autoComplete="current-password"
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-full flex-1 border-0 bg-transparent px-0 text-[14.5px] shadow-none focus-visible:ring-0 dark:bg-transparent"
      />
    </FieldFrame>
  );
}
