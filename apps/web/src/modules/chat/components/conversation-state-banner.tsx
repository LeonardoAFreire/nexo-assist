import type { Conversation } from '@nexo/contracts';
import { Headset } from 'lucide-react';
import { formatDateTime } from '@/lib/format-date-time';

type ConversationStateBannerProps = {
  conversation: Conversation | null;
};

type BannerContent = {
  title: string;
  detail: string;
};

function bannerContent(conversation: Conversation): BannerContent | null {
  const { state, handoff, assignedAnalyst } = conversation;
  if (state === 'waiting_analyst') {
    const level = handoff ? `Suporte ${handoff.level}` : 'Suporte';
    const due = handoff ? ` · contato até ${formatDateTime(handoff.contactDueAt)}` : '';
    return { title: 'Aguardando atendente', detail: `${level}${due}` };
  }
  if (state === 'with_analyst' && assignedAnalyst) {
    const level = assignedAnalyst.supportLevel ? ` · Suporte ${assignedAnalyst.supportLevel}` : '';
    return { title: 'Você está com um analista', detail: `${assignedAnalyst.name}${level}` };
  }
  return null;
}

export function ConversationStateBanner({ conversation }: ConversationStateBannerProps) {
  const content = conversation ? bannerContent(conversation) : null;
  return (
    <output aria-live="polite" className="block">
      {content ? (
        <div className="flex items-center gap-3 border-b border-rule bg-primary-soft px-4 py-2.5 md:px-12 lg:px-32 xl:px-48">
          <Headset aria-hidden="true" className="size-4 shrink-0 text-primary-text" />
          <p className="mx-auto flex w-full max-w-3xl flex-wrap gap-x-3 text-sm text-ink">
            <span className="font-semibold">{content.title}</span>
            <span className="text-ink-2">{content.detail}</span>
          </p>
        </div>
      ) : null}
    </output>
  );
}
