import { Global, Module } from '@nestjs/common';
import { TICKETS_API } from '@nexo/contracts';
import { AppConfig } from '@nexo/shared/config';
import { CLOCK, type Clock } from './core/clock.js';
import { TICKET_REPOSITORY } from './core/ticket-repository.js';
import { TicketsService } from './core/tickets-service.js';
import { HandoffListener } from './http/handoff.listener.js';
import { TicketsController } from './http/tickets.controller.js';
import { DrizzleTicketRepository } from './persistence/drizzle-ticket.repository.js';
import { LegacyOutageSimulator } from './persistence/legacy-outage-simulator.js';
import { OutageWindow } from './persistence/outage-window.js';
import { SystemClock } from './persistence/system-clock.js';
import { TicketSeeder } from './persistence/ticket.seeder.js';
import { TicketsMigrator } from './persistence/tickets.migrator.js';

function buildOutageWindow(config: AppConfig, clock: Clock): OutageWindow {
  return new OutageWindow(
    {
      mode: config.get('TICKETS_OUTAGE_MODE'),
      probability: config.get('TICKETS_OUTAGE_PROBABILITY'),
      durationMs: config.get('TICKETS_OUTAGE_DURATION_MS'),
    },
    { clock, random: Math.random },
  );
}

@Global()
@Module({
  controllers: [TicketsController],
  providers: [
    TicketsMigrator,
    TicketSeeder,
    HandoffListener,
    DrizzleTicketRepository,
    { provide: CLOCK, useClass: SystemClock },
    {
      provide: TICKET_REPOSITORY,
      inject: [DrizzleTicketRepository, AppConfig, CLOCK],
      useFactory: (repository: DrizzleTicketRepository, config: AppConfig, clock: Clock) =>
        new LegacyOutageSimulator(repository, buildOutageWindow(config, clock)),
    },
    TicketsService,
    { provide: TICKETS_API, useExisting: TicketsService },
  ],
  exports: [TICKETS_API],
})
export class TicketsModule {}
