import type { ChatMessage } from '@nexo/contracts';
import { AgentMessage } from './agent-message.js';
import { EmployeeMessage } from './employee-message.js';

type MessageListProps = {
  messages: ChatMessage[];
};

function isRenderable(message: ChatMessage): boolean {
  const isConversational = message.author === 'employee' || message.author === 'agent';
  return isConversational && message.status === 'complete';
}

function MessageItem({ message }: { message: ChatMessage }) {
  if (message.author === 'employee') {
    return <EmployeeMessage text={message.text} />;
  }

  return (
    <AgentMessage
      text={message.text}
      steps={message.turn?.steps ?? []}
      parts={message.parts}
      decision={message.turn?.decision ?? null}
      busy={false}
    />
  );
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
