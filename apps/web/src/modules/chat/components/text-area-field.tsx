import { useId } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { errorId } from './error-id.js';
import { FormField } from './form-field.js';

type TextAreaFieldProps = {
  label: string;
  value: string;
  error: string | undefined;
  onChange: (value: string) => void;
};

export function TextAreaField({ label, value, error, onChange }: TextAreaFieldProps) {
  const id = useId();
  return (
    <FormField id={id} label={label} error={error}>
      <Textarea
        id={id}
        value={value}
        aria-invalid={error !== undefined}
        aria-describedby={error ? errorId(id) : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
    </FormField>
  );
}
