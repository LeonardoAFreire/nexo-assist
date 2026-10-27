import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { errorId } from './error-id.js';

type FormFieldProps = {
  id: string;
  label: string;
  error: string | undefined;
  children: ReactNode;
};

export function FormField({ id, label, error, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={errorId(id)} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
