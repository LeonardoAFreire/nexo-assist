import type { ReactNode } from 'react';

type CardBodyProps = {
  eyebrow: ReactNode;
  children: ReactNode;
};

type CardTitleProps = {
  id?: string;
  children: ReactNode;
};

export function CardBody({ eyebrow, children }: CardBodyProps) {
  return (
    <div className="flex flex-col gap-1.5 px-[18px] pt-4 pb-3.5">
      {eyebrow}
      {children}
    </div>
  );
}

export function CardTitle({ id, children }: CardTitleProps) {
  return (
    <h3 id={id} className="text-lg leading-tight font-semibold tracking-[-0.011em] text-ink">
      {children}
    </h3>
  );
}

export function CardDescription({ children }: { children: ReactNode }) {
  return <p className="text-[13.5px] leading-normal whitespace-pre-wrap text-ink-2">{children}</p>;
}
