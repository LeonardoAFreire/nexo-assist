import type { ChatConversationHandedOff } from '@nexo/contracts';
import type { HandoffEventPublisher } from '../handoff/hand-off-conversation.js';

export class RecordingEventPublisher implements HandoffEventPublisher {
  readonly published: ChatConversationHandedOff[] = [];

  async publish(event: ChatConversationHandedOff): Promise<void> {
    this.published.push(event);
  }
}
