import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';

type FieldFrameProps = {
  inputId: string;
  label: string;
  icon: ReactNode;
  action?: ReactNode;
  trailing?: ReactNode;
  children: ReactNode;
};

export function FieldFrame({ inputId, label, icon, action, trailing, children }: FieldFrameProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={inputId} className="text-[13.5px] font-medium text-ink">
          {label}
        </Label>
        {action}
      </div>
      <div className="group flex h-11 items-center gap-2.5 rounded-lg border border-input bg-paper pr-2 pl-3.5 shadow-[0_1px_2px_#1b24310a] focus-within:border-cta focus-within:ring-[0.5px] focus-within:ring-cta">
        <span
          aria-hidden="true"
          className="text-ink-3 group-focus-within:text-primary-text [&>svg]:size-4"
        >
          {icon}
        </span>
        {children}
        {trailing}
      </div>
    </div>
  );
}
