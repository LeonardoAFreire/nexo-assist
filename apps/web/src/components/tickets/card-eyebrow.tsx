import type { ReactNode } from 'react';

type CardEyebrowProps = {
  kind: string;
  reference: string;
  state: ReactNode;
};

export function CardEyebrow({ kind, reference, state }: CardEyebrowProps) {
  return (
    <header className="flex items-center gap-2 pb-0.5 text-[12.5px] text-ink-3">
      <span className="font-medium">{kind}</span>
      <span aria-hidden="true" className="size-[3px] rounded-full bg-rule" />
      <span>{reference}</span>
      <span className="ml-auto">{state}</span>
    </header>
  );
}
