export type GuardEventType = 'guard:before' | 'guard:after' | 'guard:blocked' | 'guard:error';

export type GuardEventHandler = (payload: Record<string, unknown>) => void | Promise<void>;

export class EventBus {
  private listeners = new Map<GuardEventType, GuardEventHandler[]>();

  on(event: GuardEventType, handler: GuardEventHandler): void {
    const handlers = this.listeners.get(event) ?? [];
    handlers.push(handler);
    this.listeners.set(event, handlers);
  }

  off(event: GuardEventType, handler: GuardEventHandler): void {
    const handlers = this.listeners.get(event);
    if (!handlers) return;
    this.listeners.set(event, handlers.filter(h => h !== handler));
  }

  async emit(event: GuardEventType, payload: Record<string, unknown>): Promise<void> {
    const handlers = this.listeners.get(event) ?? [];
    for (const handler of handlers) {
      await handler(payload);
    }
  }

  removeAll(): void {
    this.listeners.clear();
  }
}
