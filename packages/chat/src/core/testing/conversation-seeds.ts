import type { HandoffInfo } from '@nexo/contracts';
import { Conversation } from '../conversation/conversation.js';
import type { ChatFixture } from './chat-fixture.js';
import { CONVERSATION_ID, NOW_ISO } from './factories.js';
import { ANA, RAFAEL } from './people.js';

export function makeHandoffInfo(overrides: Partial<HandoffInfo> = {}): HandoffInfo {
  return {
    reason: 'requested',
    level: 'N1',
    summary: 'Ana pediu um analista.',
    ticketNumbers: [],
    confidence: null,
    contactDueAt: '2026-10-26T15:05:00.000Z',
    handedOffAt: NOW_ISO,
    ...overrides,
  };
}

export type SeedState = 'agent' | 'waiting_analyst' | 'with_analyst' | 'closed';

export type SeedInput = {
  state: SeedState;
  id?: string;
  employeeId?: string;
  handoff?: Partial<HandoffInfo>;
};

export async function seedConversation(
  fixture: ChatFixture,
  input: SeedInput,
): Promise<Conversation> {
  const open = Conversation.open({
    id: input.id ?? CONVERSATION_ID,
    employeeId: input.employeeId ?? ANA.id,
    now: NOW_ISO,
  });
  const conversation = advance(open, input);
  await fixture.conversations.save(conversation);
  return conversation;
}

function advance(open: Conversation, input: SeedInput): Conversation {
  if (input.state === 'agent') {
    return open;
  }
  if (input.state === 'closed') {
    return open.closeByAgent(NOW_ISO);
  }
  const waiting = open.handOff(makeHandoffInfo(input.handoff));
  return input.state === 'waiting_analyst' ? waiting : waiting.claim(RAFAEL.id);
}
