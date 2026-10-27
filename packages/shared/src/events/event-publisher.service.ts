import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { DomainEvent } from '@nexo/contracts';

@Injectable()
export class EventPublisher {
  constructor(private readonly emitter: EventEmitter2) {}

  async publish<TEvent extends DomainEvent<string, unknown>>(event: TEvent): Promise<void> {
    await this.emitter.emitAsync(event.name, event);
  }
}
