import type { ChatMessage, Conversation as ConversationView } from '@nexo/contracts';
import type { ConversationViewBuilder } from '../view/conversation-view-builder.js';
import type { ClaimConversation, ClaimConversationInput } from './claim-conversation.js';
import type { CloseConversation } from './close-conversation.js';
import type { AnalystConversationInput, ReleaseConversation } from './release-conversation.js';
import type { SendAnalystMessage, SendAnalystMessageInput } from './send-analyst-message.js';

export type AnalystAttendanceDeps = {
  claim: ClaimConversation;
  release: ReleaseConversation;
  close: CloseConversation;
  send: SendAnalystMessage;
  views: ConversationViewBuilder;
};

export class AnalystAttendance {
  constructor(private readonly deps: AnalystAttendanceDeps) {}

  async claim(input: ClaimConversationInput): Promise<ConversationView> {
    return this.deps.views.build(await this.deps.claim.execute(input));
  }

  async release(input: AnalystConversationInput): Promise<ConversationView> {
    return this.deps.views.build(await this.deps.release.execute(input));
  }

  async close(input: AnalystConversationInput): Promise<ConversationView> {
    return this.deps.views.build(await this.deps.close.execute(input));
  }

  sendMessage(input: SendAnalystMessageInput): Promise<ChatMessage> {
    return this.deps.send.execute(input);
  }
}
