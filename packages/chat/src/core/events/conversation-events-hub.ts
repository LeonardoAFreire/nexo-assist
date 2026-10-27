import type { ConversationUpdatedEvent, MessageCreatedEvent } from '@nexo/contracts';
import { filter, map, Observable, Subject } from 'rxjs';

export type ConversationStreamPayload = ConversationUpdatedEvent | MessageCreatedEvent;

export type ConversationChange = {
  employeeId: string;
  conversationId: string;
  event: ConversationStreamPayload;
};

export class ConversationEventsHub {
  private readonly changes = new Subject<ConversationChange>();

  publish(change: ConversationChange): void {
    this.changes.next(change);
  }

  forEmployee(employeeId: string): Observable<ConversationStreamPayload> {
    return this.changes.pipe(
      filter((change) => change.employeeId === employeeId),
      map((change) => change.event),
    );
  }

  forConversation(conversationId: string): Observable<ConversationStreamPayload> {
    return this.changes.pipe(
      filter((change) => change.conversationId === conversationId),
      map((change) => change.event),
    );
  }

  forConsole(): Observable<ConversationChange> {
    return this.changes.asObservable();
  }

  close(): void {
    this.changes.complete();
  }
}
