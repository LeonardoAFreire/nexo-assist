import type { ChatMessage, MessageAuthor, SupportLevel } from '@nexo/contracts';
import { afterMinutes, seedMessage } from './seed-factories.js';

export type ScriptLine = {
  author: MessageAuthor;
  text: string;
  minutesAfterStart: number;
  authorName?: string;
  authorLevel?: SupportLevel;
};

export type ScriptInput = {
  conversationNumber: number;
  startedAt: Date;
  lines: readonly ScriptLine[];
};

export function buildScript(input: ScriptInput): ChatMessage[] {
  return input.lines.map((line, index) =>
    seedMessage({
      ...line,
      conversationNumber: input.conversationNumber,
      order: index + 1,
      at: afterMinutes(input.startedAt, line.minutesAfterStart),
    }),
  );
}
