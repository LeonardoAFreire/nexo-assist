import type { ChatMessage } from '@nexo/contracts';
import { AgentMessage } from './agent-message.js';
import { AnalystMessage } from './analyst-message.js';
import { EmployeeMessage } from './employee-message.js';
import { SystemEvent } from './system-event.js';

type MessageListProps = {
  messages: ChatMessage[];
};

function isRenderable(message: ChatMessage): boolean {
  return message.status === 'complete';
}

function MessageItem({ message }: { message: ChatMessage }) {
  switch (message.author) {
    case 'employee':
      return <EmployeeMessage text={message.text} />;
    case 'analyst':
      return <AnalystMessage message={message} />;
    case 'system':
      return <SystemEvent message={message} />;
    case 'agent':
      return (
        <AgentMessage
          messageId={message.id}
          text={message.text}
          steps={message.turn?.steps ?? []}
          parts={message.parts}
          decision={message.turn?.decision ?? null}
          busy={false}
        />
      );
  }
}

export function MessageList({ messages }: MessageListProps) {
  return (
    <ol aria-label="Mensagens" className="flex flex-col gap-5">
      {messages.filter(isRenderable).map((message: ChatMessage) => (
        <li key={message.id}>
          <MessageItem message={message} />
        </li>
      ))}
    </ol>
  );
}
