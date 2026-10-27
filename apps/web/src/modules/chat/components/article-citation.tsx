import type { ArticleCitationPart } from '@nexo/contracts';
import { BookOpen } from 'lucide-react';

type ArticleCitationProps = {
  part: ArticleCitationPart;
};

export function ArticleCitation({ part }: ArticleCitationProps) {
  const verdict = part.applies ? 'se aplica ao seu caso' : 'não se aplica ao seu caso';
  return (
    <aside className="flex items-start gap-2 rounded-xl border border-rule bg-desk px-3 py-2 text-[13px] text-ink-2">
      <BookOpen aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-ink-3" />
      <p>
        <span className="font-semibold text-ink">{part.title}</span>
        {` ${verdict}: ${part.reason}`}
      </p>
    </aside>
  );
}
