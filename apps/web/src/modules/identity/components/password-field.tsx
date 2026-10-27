import { LockKeyhole } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { FieldFrame } from './field-frame.js';
import { ForgotPasswordButton } from './forgot-password-button.js';
import { PasswordVisibilityToggle } from './password-visibility-toggle.js';

type PasswordFieldProps = {
  value: string;
  onChange: (value: string) => void;
  onForgot: () => void;
};

export function PasswordField({ value, onChange, onForgot }: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);
  const toggle = (
    <PasswordVisibilityToggle
      isVisible={isVisible}
      onToggle={() => setIsVisible((current: boolean) => !current)}
    />
  );
  return (
    <FieldFrame
      inputId="password"
      label="Senha"
      icon={<LockKeyhole />}
      action={<ForgotPasswordButton onClick={onForgot} />}
      trailing={toggle}
    >
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
