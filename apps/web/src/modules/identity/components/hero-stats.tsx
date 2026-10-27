import { cn } from '@/lib/utils';

type Stat = {
  value: string;
  label: string;
  live?: boolean;
};

const STATS: Stat[] = [
  { value: '8 s', label: 'primeira resposta, em média' },
  { value: '72%', label: 'resolvidos sem fila' },
  { value: '6', label: 'analistas online agora', live: true },
];

export function HeroStats() {
  return (
    <dl className="grid grid-cols-3 border-t border-white/10 pt-6">
      {STATS.map((stat: Stat, index: number) => (
        <div
          key={stat.label}
          className={cn(
            'flex flex-col-reverse gap-1.5',
            index > 0 && 'border-l border-white/10 pl-6',
          )}
        >
          <dt className="text-[13.5px] text-white/55">{stat.label}</dt>
          <dd className="flex items-center gap-2 font-display text-[34px] leading-none tracking-[-0.018em]">
            {stat.value}
            {stat.live && <span className="size-2 rounded-full bg-success" />}
          </dd>
        </div>
      ))}
    </dl>
  );
}
