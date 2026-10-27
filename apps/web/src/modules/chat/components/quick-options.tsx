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
    <fieldset className="flex flex-wrap gap-2">
      <legend className="sr-only">{part.question}</legend>
      {part.options.map((option: QuickOption, index: number) => (
        <QuickOptionButton
          key={option.id}
          option={option}
          shortcut={index + 1}
          disabled={!canReply}
          onPick={pick}
        />
      ))}
    </fieldset>
  );
}
