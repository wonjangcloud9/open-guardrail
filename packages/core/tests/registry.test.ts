import { describe, it, expect } from 'vitest';
import { GuardRegistry } from '../src/registry.js';
import type { GuardPlugin } from '../src/registry.js';
import type { Guard, GuardResult } from '../src/types.js';

const dummyGuard: Guard = {
  name: 'dummy', version: '1.0.0', description: 'test',
  category: 'custom', supportedStages: ['input', 'output'],
  async check(): Promise<GuardResult> {
    return { guardName: 'dummy', passed: true, action: 'allow', latencyMs: 0 };
  },
};

describe('GuardRegistry', () => {
  it('registers and resolves a guard factory', () => {
    const registry = new GuardRegistry();
    registry.register('dummy', () => dummyGuard);
    const guard = registry.resolve('dummy', {});
    expect(guard.name).toBe('dummy');
  });

  it('throws on unknown guard type', () => {
    const registry = new GuardRegistry();
    expect(() => registry.resolve('nope', {})).toThrow(/unknown guard/i);
  });

  it('lists registered guard types', () => {
    const registry = new GuardRegistry();
    registry.register('a', () => dummyGuard);
    registry.register('b', () => dummyGuard);
    expect(registry.list()).toEqual(['a', 'b']);
  });

  it('registers a plugin with use()', () => {
    const registry = new GuardRegistry();
    const plugin: GuardPlugin = {
      meta: { name: 'test-plugin', version: '1.0.0', description: 'A test plugin' },
      guards: {
        'tp-guard-a': () => dummyGuard,
        'tp-guard-b': () => dummyGuard,
      },
    };

    registry.use(plugin);
    expect(registry.has('tp-guard-a')).toBe(true);
    expect(registry.has('tp-guard-b')).toBe(true);
    expect(registry.resolve('tp-guard-a', {}).name).toBe('dummy');
  });

  it('returns plugin metadata via getMeta()', () => {
    const registry = new GuardRegistry();
    registry.register('builtin', () => dummyGuard);
    registry.use({
      meta: { name: 'my-plugin', version: '2.0.0', description: 'desc', author: 'Lucas' },
      guards: { 'my-guard': () => dummyGuard },
    });

    expect(registry.getMeta('builtin')).toBeUndefined();
    expect(registry.getMeta('my-guard')).toEqual({
      name: 'my-plugin', version: '2.0.0', description: 'desc', author: 'Lucas',
    });
  });

  it('lists plugins deduplicated', () => {
    const registry = new GuardRegistry();
    registry.use({
      meta: { name: 'p1', version: '1.0.0', description: 'one' },
      guards: { 'p1-a': () => dummyGuard, 'p1-b': () => dummyGuard },
    });
    registry.use({
      meta: { name: 'p2', version: '0.1.0', description: 'two' },
      guards: { 'p2-x': () => dummyGuard },
    });

    const plugins = registry.plugins();
    expect(plugins).toHaveLength(2);
    expect(plugins.map(p => p.name)).toEqual(['p1', 'p2']);
  });

  it('describe() lists guards with plugin info', () => {
    const registry = new GuardRegistry();
    registry.register('builtin', () => dummyGuard);
    registry.use({
      meta: { name: 'ext', version: '1.0.0', description: 'external' },
      guards: { 'ext-guard': () => dummyGuard },
    });

    const desc = registry.describe();
    expect(desc).toHaveLength(2);
    expect(desc[0]).toEqual({ type: 'builtin', plugin: undefined });
    expect(desc[1].type).toBe('ext-guard');
    expect(desc[1].plugin?.name).toBe('ext');
  });

  it('unregister() removes a guard', () => {
    const registry = new GuardRegistry();
    registry.register('temp', () => dummyGuard);
    expect(registry.has('temp')).toBe(true);
    registry.unregister('temp');
    expect(registry.has('temp')).toBe(false);
  });

  it('clear() removes all guards', () => {
    const registry = new GuardRegistry();
    registry.register('a', () => dummyGuard);
    registry.register('b', () => dummyGuard);
    registry.clear();
    expect(registry.list()).toEqual([]);
  });
});
