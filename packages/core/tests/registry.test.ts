import { describe, it, expect } from 'vitest';
import { GuardRegistry } from '../src/registry.js';
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
});
