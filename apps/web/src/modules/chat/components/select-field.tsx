import { useId } from 'react';
import { errorId } from './error-id.js';
import { FormField } from './form-field.js';

type SelectFieldProps<Value extends string> = {
  label: string;
  value: Value;
  options: Record<Value, string>;
  error: string | undefined;
  onChange: (value: Value) => void;
};

export function SelectField<Value extends string>(props: SelectFieldProps<Value>) {
  const { label, value, options, error, onChange } = props;
  const id = useId();
  return (
    <FormField id={id} label={label} error={error}>
      <select
        id={id}
        value={value}
        aria-invalid={error !== undefined}
        aria-describedby={error ? errorId(id) : undefined}
        onChange={(event) => onChange(event.target.value as Value)}
        className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {(Object.keys(options) as Value[]).map((option: Value) => (
          <option key={option} value={option}>
            {options[option]}
          </option>
        ))}
      </select>
    </FormField>
  );
}
