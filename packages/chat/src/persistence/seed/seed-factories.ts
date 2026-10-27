import {
  type ChatMessage,
  DEMO_PEOPLE,
  type DemoPerson,
  type MessageAuthor,
  type SupportLevel,
} from '@nexo/contracts';
import type { ConversationProps } from '../../core/conversation/conversation-props.js';

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const ID_SUFFIX_LENGTH = 12;

export type SeedConversation = {
  conversation: ConversationProps;
  messages: ChatMessage[];
};

export type SeedMessageInput = {
  conversationNumber: number;
  order: number;
  author: MessageAuthor;
  text: string;
  at: Date;
  authorName?: string;
  authorLevel?: SupportLevel;
};

export function ago(now: Date, offset: { days?: number; hours?: number; minutes?: number }): Date {
  const elapsed =
    (offset.days ?? 0) * DAY_MS + (offset.hours ?? 0) * HOUR_MS + (offset.minutes ?? 0) * MINUTE_MS;
  return new Date(now.getTime() - elapsed);
}

export function afterMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * MINUTE_MS);
}

export function seedConversationId(conversationNumber: number): string {
  return `c0de0000-0000-4000-8000-${String(conversationNumber).padStart(ID_SUFFIX_LENGTH, '0')}`;
}

export function demoPersonByEmail(email: string): DemoPerson {
  const person = DEMO_PEOPLE.find((candidate) => candidate.email === email);
  if (person === undefined) {
    throw new Error(`Pessoa de exemplo não encontrada: ${email}`);
  }
  return person;
}

export function seedMessage(input: SeedMessageInput): ChatMessage {
  const suffix = `${input.conversationNumber}${String(input.order).padStart(2, '0')}`;
  return {
    id: `d0de0000-0000-4000-8000-${suffix.padStart(ID_SUFFIX_LENGTH, '0')}`,
    conversationId: seedConversationId(input.conversationNumber),
    author: input.author,
    authorName: input.authorName ?? null,
    authorLevel: input.authorLevel ?? null,
    text: input.text,
    parts: [],
    turn: null,
    status: 'complete',
    createdAt: input.at.toISOString(),
  };
}
