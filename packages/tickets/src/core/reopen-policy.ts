import { MILLISECONDS_PER_DAY } from './time-units.js';

export const REOPEN_WINDOW_DAYS = 7;

const REOPEN_WINDOW_MILLISECONDS = REOPEN_WINDOW_DAYS * MILLISECONDS_PER_DAY;

export class ReopenPolicy {
  canReopen(resolvedAt: Date, now: Date): boolean {
    return now.getTime() - resolvedAt.getTime() <= REOPEN_WINDOW_MILLISECONDS;
  }

  daysSinceResolution(resolvedAt: Date, now: Date): number {
    return Math.floor((now.getTime() - resolvedAt.getTime()) / MILLISECONDS_PER_DAY);
  }
}
