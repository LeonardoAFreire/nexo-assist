import type { Clock } from '../clock/clock.js';

export class MutableClock implements Clock {
  private current: number;

  constructor(startIso: string) {
    this.current = Date.parse(startIso);
  }

  now(): Date {
    return new Date(this.current);
  }

  advance(milliseconds: number): void {
    this.current += milliseconds;
  }
}
