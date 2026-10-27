import type { ReactNode } from 'react';

type DecisionSectionProps = {
  title: string;
  children: ReactNode;
};

export function DecisionSection({ title, children }: DecisionSectionProps) {
  return (
    <section className="flex flex-col gap-1">
      <h4 className="text-[11px] font-semibold tracking-wide text-ink-3 uppercase">{title}</h4>
      <div className="text-[13px] text-ink-2">{children}</div>
    </section>
  );
}
