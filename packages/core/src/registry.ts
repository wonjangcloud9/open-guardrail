import type { Guard } from './types.js';

type GuardFactoryFn = (config: Record<string, unknown>) => Guard;

export class GuardRegistry {
  private factories = new Map<string, GuardFactoryFn>();

  register(type: string, factory: GuardFactoryFn): void {
    this.factories.set(type, factory);
  }

  resolve(type: string, config: Record<string, unknown>): Guard {
    const factory = this.factories.get(type);
    if (!factory) {
      throw new Error(`Unknown guard type: "${type}". Registered: ${this.list().join(', ')}`);
    }
    return factory(config);
  }

  has(type: string): boolean {
    return this.factories.has(type);
  }

  list(): string[] {
    return [...this.factories.keys()];
  }
}
