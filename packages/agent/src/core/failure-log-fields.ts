import type { LogFields } from './agent-logger.js';

const MESSAGE_MAX_LENGTH = 200;

export function failureLogFields(conversationId: string, error: unknown): LogFields {
  const failure = error instanceof Error ? error : new Error(String(error));
  const statusCode = 'statusCode' in failure ? failure.statusCode : undefined;
  return {
    module: 'agent',
    conversationId,
    errorName: failure.name,
    errorMessage: failure.message.slice(0, MESSAGE_MAX_LENGTH),
    statusCode,
  };
}
