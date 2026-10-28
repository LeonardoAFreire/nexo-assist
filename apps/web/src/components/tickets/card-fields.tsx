import type { ReactNode } from 'react';

type CardFieldProps = {
  label: string;
  children: ReactNode;
};

export function CardFields({ children }: { children: ReactNode }) {
  return (
    <div className="px-[18px] pb-4">
      <dl className="grid auto-cols-fr grid-flow-col gap-6 border-t border-rule pt-3">
        {children}
      </dl>
    </div>
  );
}

export function CardField({ label, children }: CardFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-[12.5px] text-ink-3">{label}</dt>
      <dd className="flex items-center gap-1.5 text-[14.5px] font-medium text-ink">{children}</dd>
    </div>
  );
}
