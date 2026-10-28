import { cn } from '@/lib/utils';

const PALETTE = [
  'bg-[#dce9f7] text-[#0062c4]',
  'bg-[#f6e3d3] text-[#9a4a12]',
  'bg-[#e6e1f7] text-[#5b3fc4]',
  'bg-[#ddf0e6] text-[#1e7a4c]',
  'bg-[#f7e1e6] text-[#a3324f]',
  'bg-[#e5e8ec] text-[#3d4656]',
  'bg-[#fbefd0] text-[#8a6100]',
] as const;

type PersonAvatarProps = {
  initials: string;
  className: string;
};

function paletteIndexOf(initials: string): number {
  let total = 0;
  for (let index = 0; index < initials.length; index += 1) {
    total += initials.charCodeAt(index);
  }
  return total % PALETTE.length;
}

export function PersonAvatar({ initials, className }: PersonAvatarProps) {
  const colors = PALETTE[paletteIndexOf(initials)];
  return (
    <span
      aria-hidden="true"
      className={cn('flex shrink-0 items-center justify-center rounded-full', colors, className)}
    >
      {initials}
    </span>
  );
}
