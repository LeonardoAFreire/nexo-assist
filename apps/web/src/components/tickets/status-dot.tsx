import { cn } from '@/lib/utils';

type StatusDotProps = {
  className: string;
};

export function StatusDot({ className }: StatusDotProps) {
  return <span aria-hidden="true" className={cn('size-1.5 shrink-0 rounded-full', className)} />;
}
