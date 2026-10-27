export type DomainEvent<TName extends string, TPayload> = {
  name: TName;
  occurredAt: string;
  payload: TPayload;
};

export type EventHandler<TEvent extends DomainEvent<string, unknown>> = (
  event: TEvent,
) => void | Promise<void>;
