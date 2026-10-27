import type { Clock } from '../../core/clock.js';

const DEFAULT_START = '2026-10-26T13:00:00.000Z';

export class FakeClock implements Clock {
  private current: Date;

  constructor(start: string = DEFAULT_START) {
    this.current = new Date(start);
  }

  now(): Date {
    return new Date(this.current);
  }

  advance(milliseconds: number): void {
    this.current = new Date(this.current.getTime() + milliseconds);
  }
}
