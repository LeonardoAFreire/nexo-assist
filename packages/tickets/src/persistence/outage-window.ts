import { TicketsUnavailableError } from '@nexo/contracts';
import type { Clock } from '../core/clock.js';

export type OutageMode = 'off' | 'random' | 'forced';

export type OutageConfig = {
  mode: OutageMode;
  probability: number;
  durationMs: number;
};

export type OutageEnvironment = {
  clock: Clock;
  random: () => number;
};

export class OutageWindow {
  private unavailableUntil = 0;

  constructor(
    private readonly config: OutageConfig,
    private readonly environment: OutageEnvironment,
  ) {}

  ensureAvailable(): void {
    if (this.config.mode === 'off') {
      return;
    }
    if (this.config.mode === 'forced' || this.isWindowOpen()) {
      throw new TicketsUnavailableError();
    }
    if (this.environment.random() < this.config.probability) {
      this.unavailableUntil = this.now() + this.config.durationMs;
      throw new TicketsUnavailableError();
    }
  }

  private isWindowOpen(): boolean {
    return this.now() < this.unavailableUntil;
  }

  private now(): number {
    return this.environment.clock.now().getTime();
  }
}
