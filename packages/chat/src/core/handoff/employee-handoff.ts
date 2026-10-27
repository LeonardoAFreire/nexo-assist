import type { Conversation as ConversationView } from '@nexo/contracts';
import type { ConversationViewBuilder } from '../view/conversation-view-builder.js';
import type { RequestHandoff, RequestHandoffInput } from './request-handoff.js';

export class EmployeeHandoff {
  constructor(
    private readonly request: RequestHandoff,
    private readonly views: ConversationViewBuilder,
  ) {}

  async execute(input: RequestHandoffInput): Promise<ConversationView> {
    return this.views.build(await this.request.execute(input));
  }
}
