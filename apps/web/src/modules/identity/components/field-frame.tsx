import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';

type FieldFrameProps = {
  inputId: string;
  label: string;
  icon: ReactNode;
  trailing?: ReactNode;
  children: ReactNode;
};

export function FieldFrame({ inputId, label, icon, trailing, children }: FieldFrameProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={inputId} className="text-[13.5px] font-medium text-ink">
        {label}
      </Label>
      <div className="flex h-11 items-center gap-2.5 rounded-lg border border-input bg-paper pr-2 pl-3.5 shadow-xs focus-within:border-cta focus-within:ring-3 focus-within:ring-cta/20">
        <span aria-hidden="true" className="text-ink-3 [&>svg]:size-4">
          {icon}
        </span>
        {children}
        {trailing}
      </div>
    </div>
  );
}
