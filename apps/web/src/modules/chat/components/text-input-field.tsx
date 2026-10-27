import { useId } from 'react';
import { Input } from '@/components/ui/input';
import { errorId } from './error-id.js';
import { FormField } from './form-field.js';

type TextInputFieldProps = {
  label: string;
  value: string;
  error: string | undefined;
  onChange: (value: string) => void;
};

export function TextInputField({ label, value, error, onChange }: TextInputFieldProps) {
  const id = useId();
  return (
    <FormField id={id} label={label} error={error}>
      <Input
        id={id}
        value={value}
        aria-invalid={error !== undefined}
        aria-describedby={error ? errorId(id) : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
    </FormField>
  );
}
