import type { DomainEvent, DomainEventHandler, DomainEventName } from "./event.types";

const handlers = new Map<DomainEventName, Set<DomainEventHandler>>();

export function subscribeToDomainEvent(name: DomainEventName, handler: DomainEventHandler) {
  const existing = handlers.get(name) ?? new Set<DomainEventHandler>();
  existing.add(handler);
  handlers.set(name, existing);

  return () => {
    existing.delete(handler);
  };
}

export async function publishDomainEvent(event: DomainEvent) {
  const subscribers = handlers.get(event.name);
  if (!subscribers?.size) return;

  await Promise.all([...subscribers].map((handler) => handler(event)));
}
