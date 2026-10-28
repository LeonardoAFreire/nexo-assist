import type { ReplyRequest } from '../types/nexo-ui-message.js';

export class TurnTracker {
  private request: ReplyRequest | null = null;
  private acceptedByServer = false;

  begin(request: ReplyRequest): void {
    this.request = request;
    this.acceptedByServer = false;
  }

  beginRetry(): void {
    this.request = null;
    this.acceptedByServer = true;
  }

  accept(): ReplyRequest | null {
    this.acceptedByServer = true;
    return this.request;
  }

  get accepted(): boolean {
    return this.acceptedByServer;
  }

  get pendingText(): string | null {
    return this.request?.text ?? null;
  }
}
