import type { Guard } from './types.js';

type GuardFactoryFn = (config: Record<string, unknown>) => Guard;

export interface GuardPluginMeta {
  name: string;
  version: string;
  description: string;
  author?: string;
  homepage?: string;
  tags?: string[];
}

export interface GuardPlugin {
  meta: GuardPluginMeta;
  guards: Record<string, GuardFactoryFn>;
}

interface RegisteredGuard {
  factory: GuardFactoryFn;
  plugin?: GuardPluginMeta;
}

export class GuardRegistry {
  private entries = new Map<string, RegisteredGuard>();

  register(type: string, factory: GuardFactoryFn): void {
    this.entries.set(type, { factory });
  }

  /**
   * Register a plugin with multiple guards and metadata.
   *
   * @example
   * ```typescript
   * registry.use({
   *   meta: { name: 'my-plugin', version: '1.0.0', description: 'Custom guards' },
   *   guards: {
   *     'my-guard': (config) => myGuard(config),
   *     'another-guard': (config) => anotherGuard(config),
   *   },
   * });
   * ```
   */
  use(plugin: GuardPlugin): void {
    for (const [type, factory] of Object.entries(plugin.guards)) {
      this.entries.set(type, { factory, plugin: plugin.meta });
    }
  }

  resolve(type: string, config: Record<string, unknown>): Guard {
    const entry = this.entries.get(type);
    if (!entry) {
      throw new Error(`Unknown guard type: "${type}". Registered: ${this.list().join(', ')}`);
    }
    return entry.factory(config);
  }

  has(type: string): boolean {
    return this.entries.has(type);
  }

  list(): string[] {
    return [...this.entries.keys()];
  }

  /** Get metadata for a registered guard type. */
  getMeta(type: string): GuardPluginMeta | undefined {
    return this.entries.get(type)?.plugin;
  }

  /** List all registered plugins (deduplicated by plugin name). */
  plugins(): GuardPluginMeta[] {
    const seen = new Map<string, GuardPluginMeta>();
    for (const entry of this.entries.values()) {
      if (entry.plugin && !seen.has(entry.plugin.name)) {
        seen.set(entry.plugin.name, entry.plugin);
      }
    }
    return [...seen.values()];
  }

  /** List guards grouped by plugin. Built-in guards have plugin = undefined. */
  describe(): Array<{ type: string; plugin?: GuardPluginMeta }> {
    return [...this.entries.entries()].map(([type, entry]) => ({
      type,
      plugin: entry.plugin,
    }));
  }

  unregister(type: string): boolean {
    return this.entries.delete(type);
  }

  clear(): void {
    this.entries.clear();
  }
}
