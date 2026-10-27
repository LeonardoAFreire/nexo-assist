import type { MessageUsage } from '@nexo/contracts';

type MessageCounterProps = {
  usage: MessageUsage;
};

export function MessageCounter({ usage }: MessageCounterProps) {
  return (
    <p className="text-right text-[12.5px] text-ink-3">
      {usage.messagesUsed}/{usage.messagesLimit} mensagens nesta sessão
    </p>
  );
}
