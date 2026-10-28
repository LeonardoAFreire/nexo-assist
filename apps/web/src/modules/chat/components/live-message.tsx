import type { AgentStep, MessagePart } from '@nexo/contracts';
import type { NexoUIMessage } from '../types/nexo-ui-message.js';
import { AgentMessage } from './agent-message.js';
import { EmployeeMessage } from './employee-message.js';

type LiveMessageProps = {
  message: NexoUIMessage;
  streaming: boolean;
};

type LiveContent = {
  text: string;
  steps: AgentStep[];
  parts: MessagePart[];
};

function liveContent(message: NexoUIMessage): LiveContent {
  const { parts } = message;
  return {
    text: parts.map((part) => (part.type === 'text' ? part.text : '')).join(''),
    steps: parts.flatMap((part) => (part.type === 'data-step' ? [part.data] : [])),
    parts: parts.flatMap((part) => (part.type === 'data-part' ? [part.data] : [])),
  };
}

export function LiveMessage({ message, streaming }: LiveMessageProps) {
  const { text, steps, parts } = liveContent(message);
  if (message.role === 'user') {
    return <EmployeeMessage text={text} />;
  }
  return (
    <AgentMessage
      messageId={message.id}
      text={text}
      steps={steps}
      parts={parts}
      decision={null}
      busy={streaming}
    />
  );
}
