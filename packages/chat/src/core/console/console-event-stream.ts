import type {
  ConsoleItemUpdatedEvent,
  ConversationUpdatedEvent,
  MessageCreatedEvent,
} from '@nexo/contracts';
import { catchError, concat, concatMap, EMPTY, from, map, type Observable, of } from 'rxjs';
import type {
  ConversationChange,
  ConversationEventsHub,
} from '../events/conversation-events-hub.js';
import type { ConsoleQueries } from './console-queries.js';

export type ConsoleStreamPayload =
  | ConsoleItemUpdatedEvent
  | ConversationUpdatedEvent
  | MessageCreatedEvent;

export type OpenConsoleStreamInput = {
  viewerId: string;
  conversationId: string | undefined;
};

export class ConsoleEventStream {
  constructor(
    private readonly hub: ConversationEventsHub,
    private readonly queries: ConsoleQueries,
  ) {}

  open(input: OpenConsoleStreamInput): Observable<ConsoleStreamPayload> {
    return this.hub
      .forConsole()
      .pipe(
        concatMap((change) =>
          concat(this.forwarded(change, input), this.itemUpdate(change, input)),
        ),
      );
  }

  private forwarded(
    change: ConversationChange,
    input: OpenConsoleStreamInput,
  ): Observable<ConsoleStreamPayload> {
    return change.conversationId === input.conversationId ? of(change.event) : EMPTY;
  }

  private itemUpdate(
    change: ConversationChange,
    input: OpenConsoleStreamInput,
  ): Observable<ConsoleStreamPayload> {
    const update = this.queries.itemUpdate({
      viewerId: input.viewerId,
      conversationId: change.conversationId,
    });
    return from(update).pipe(
      map((data): ConsoleItemUpdatedEvent => ({ event: 'console.item.updated', data })),
      catchError(() => EMPTY),
    );
  }
}
