import type { ChatMessage } from '@nexo/contracts';
import { stripBoldMarks } from './strip-bold-marks.js';

type TurnAnnouncerProps = {
  timeline: ChatMessage[];
};

function isAnnounced(message: ChatMessage): boolean {
  return message.author === 'agent' || message.author === 'analyst';
}

export function TurnAnnouncer({ timeline }: TurnAnnouncerProps) {
  const lastAgentMessage = timeline.findLast(
    (message: ChatMessage) => isAnnounced(message) && message.status === 'complete',
  );
  return (
    <output aria-live="polite" className="sr-only">
      {lastAgentMessage === undefined ? null : stripBoldMarks(lastAgentMessage.text)}
    </output>
  );
}
