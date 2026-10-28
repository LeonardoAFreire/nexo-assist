import type { ChatStreamEvent } from '@nexo/contracts';
import {
  type AcceptedMessage,
  EmployeeMessageAcceptor,
  type SendEmployeeMessageInput,
} from './accept-employee-message.js';
import type { EmployeeTurnDeps } from './employee-turn-deps.js';
import { EmployeeTurnRunner } from './employee-turn-runner.js';
import { turnStarted } from './turn-completion.js';

export type { SendEmployeeMessageInput };

export class SendEmployeeMessage {
  private readonly acceptor: EmployeeMessageAcceptor;
  private readonly runner: EmployeeTurnRunner;

  constructor(deps: EmployeeTurnDeps) {
    this.acceptor = new EmployeeMessageAcceptor(deps);
    this.runner = new EmployeeTurnRunner(deps);
  }

  async execute(input: SendEmployeeMessageInput): Promise<AsyncIterable<ChatStreamEvent>> {
    const accepted = await this.acceptor.accept(input);
    return this.stream(accepted);
  }

  private stream(accepted: AcceptedMessage): AsyncGenerator<ChatStreamEvent> {
    const { context, paused } = accepted;
    const acceptedEvent: ChatStreamEvent = {
      event: 'message.accepted',
      data: { message: context.employeeMessage, usage: context.usage },
    };
    if (paused !== null) {
      return skippedStream(acceptedEvent, paused);
    }
    return this.runner.runLocked(context, [acceptedEvent, turnStarted(context.replyId)]);
  }
}

async function* skippedStream(
  accepted: ChatStreamEvent,
  reason: 'waiting_analyst' | 'with_analyst',
): AsyncGenerator<ChatStreamEvent> {
  yield accepted;
  yield { event: 'turn.skipped', data: { reason } };
}
