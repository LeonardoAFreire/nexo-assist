import { Lock } from 'lucide-react';
import type { ReactNode } from 'react';

type ProfileCardProps = {
  name: string;
  email: string;
};

type ProfileRowProps = {
  term: string;
  children: ReactNode;
};

function ProfileRow({ term, children }: ProfileRowProps) {
  return (
    <div className="flex items-center gap-4 px-6 py-5 not-last:border-b not-last:border-rule">
      <dt className="w-40 text-[13.5px] text-ink-3">{term}</dt>
      <dd className="flex flex-1 flex-col gap-0.5">{children}</dd>
    </div>
  );
}

export function ProfileCard({ name, email }: ProfileCardProps) {
  return (
    <dl className="rounded-2xl border border-ink/10 bg-paper shadow-sm">
      <ProfileRow term="Nome">
        <span className="text-[14.5px] font-medium text-ink">{name}</span>
      </ProfileRow>
      <ProfileRow term="E-mail corporativo">
        <span className="text-[14.5px] font-medium text-ink">{email}</span>
        <span className="flex items-center gap-[5px] whitespace-nowrap text-[12.5px] text-ink-3">
          <Lock aria-hidden="true" className="size-[13px]" />
          Gerenciado pela TI
        </span>
      </ProfileRow>
    </dl>
  );
}
