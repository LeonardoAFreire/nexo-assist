import { Inject, Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import { AppConfig } from '@nexo/shared/config';
import { CLOCK, type Clock } from '../core/clock/clock.js';
import { ConsoleSeedStore } from './console-seed-store.js';
import { buildConsoleSeed } from './seed/build-console-seed.js';

@Injectable()
export class ConsoleSeeder implements OnApplicationBootstrap {
  constructor(
    private readonly config: AppConfig,
    private readonly seedStore: ConsoleSeedStore,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (!this.config.get('SEED_DEMO_DATA')) {
      return;
    }
    if (!(await this.seedStore.isEmpty())) {
      return;
    }
    for (const entry of buildConsoleSeed(this.clock.now())) {
      await this.seedStore.store(entry);
    }
  }
}
