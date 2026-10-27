export class TurnEventQueue<T> implements AsyncIterable<T> {
  private readonly items: T[] = [];
  private wake: (() => void) | null = null;
  private closed = false;

  push(item: T): void {
    this.items.push(item);
    this.notify();
  }

  close(): void {
    this.closed = true;
    this.notify();
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<T> {
    while (this.items.length > 0 || !this.closed) {
      const next = this.items.shift();
      if (next === undefined) {
        await this.nextChange();
      } else {
        yield next;
      }
    }
  }

  private nextChange(): Promise<void> {
    return new Promise((resolve) => {
      this.wake = resolve;
    });
  }

  private notify(): void {
    this.wake?.();
    this.wake = null;
  }
}
