import type { ChatMessage } from '@nexo/contracts';
import { ConsoleMessage } from './console-message.js';

type ConsoleThreadProps = {
  timeline: ChatMessage[];
};

export function ConsoleThread({ timeline }: ConsoleThreadProps) {
  return (
    <ol aria-label="Histórico da conversa" aria-live="polite" className="flex flex-col gap-4">
      {timeline.map((message: ChatMessage) => (
        <li key={message.id}>
          <ConsoleMessage message={message} />
        </li>
      ))}
    </ol>
  );
}
