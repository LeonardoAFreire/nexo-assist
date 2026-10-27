import type { ChatMessage } from '@nexo/contracts';

type TurnAnnouncerProps = {
  timeline: ChatMessage[];
};

export function TurnAnnouncer({ timeline }: TurnAnnouncerProps) {
  const lastAgentMessage = timeline.findLast(
    (message: ChatMessage) => message.author === 'agent' && message.status === 'complete',
  );
  return (
    <output aria-live="polite" className="sr-only">
      {lastAgentMessage?.text}
    </output>
  );
}
