import type { QuickOption, QuickOptionsPart } from '@nexo/contracts';
import { useChatActions } from '../hooks/chat-actions-context.js';
import { useQuickPick } from '../hooks/use-quick-pick.js';
import { useQuickReplyKeys } from '../hooks/use-quick-reply-keys.js';
import { QuickOptionButton } from './quick-option-button.js';

type QuickOptionsProps = {
  messageId: string | null;
  part: QuickOptionsPart;
};

export function QuickOptions({ messageId, part }: QuickOptionsProps) {
  const { busy, latestMessageId } = useChatActions();
  const canReply = messageId !== null && !part.answered && !busy;
  const pick = useQuickPick(messageId);
  const keysEnabled = canReply && messageId === latestMessageId;
  useQuickReplyKeys({ options: part.options, enabled: keysEnabled, onPick: pick });
  return (
    <fieldset className="m-0 flex min-w-0 flex-col border-0 p-0">
      <legend className="mb-3 p-0 text-[14.5px] font-semibold text-ink">{part.question}</legend>
      <div className="flex flex-wrap gap-1.5">
        {part.options.map((option: QuickOption, index: number) => (
          <QuickOptionButton
            key={option.id}
            option={option}
            shortcut={index + 1}
            disabled={!canReply}
            onPick={pick}
          />
        ))}
      </div>
    </fieldset>
  );
}
