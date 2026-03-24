import { describe, it, expect } from 'vitest';
import { GuardRouter } from '../src/router.js';
import { Pipeline } from '../src/pipeline.js';
import type { Guard, GuardResult } from '../src/types.js';

function makeGuard(name: string, block = false): Guard {
  return {
    name, version: '1.0.0', description: name, category: 'custom',
    supportedStages: ['input', 'output'],
    async check(): Promise<GuardResult> {
      return { guardName: name, passed: !block, action: block ? 'block' : 'allow', latencyMs: 0 };
    },
  };
}

describe('GuardRouter', () => {
  it('routes to correct pipeline based on classifier', async () => {
    const router = new GuardRouter({
      classifier: (text) => text.length < 10 ? 'low' : 'high',
      routes: {
        low: new Pipeline({ guards: [makeGuard('fast')] }),
        high: new Pipeline({ guards: [makeGuard('strict'), makeGuard('extra')] }),
      },
    });

    const short = await router.run('hi');
    expect(short.results).toHaveLength(1);
    expect(short.results[0].guardName).toBe('fast');

    const long = await router.run('this is a longer input text');
    expect(long.results).toHaveLength(2);
  });

  it('uses default route for unmatched classification', async () => {
    const router = new GuardRouter({
      classifier: () => 'unknown',
      routes: { low: new Pipeline({ guards: [makeGuard('low')] }) },
      defaultRoute: new Pipeline({ guards: [makeGuard('default')] }),
    });
    const result = await router.run('test');
    expect(result.results[0].guardName).toBe('default');
  });

  it('throws if no matching route and no default', async () => {
    const router = new GuardRouter({
      classifier: () => 'unknown',
      routes: { low: new Pipeline({ guards: [makeGuard('low')] }) },
    });
    await expect(router.run('test')).rejects.toThrow(/no route/i);
  });

  it('includes riskLevel in metadata', async () => {
    const router = new GuardRouter({
      classifier: () => 'high',
      routes: { high: new Pipeline({ guards: [makeGuard('g')] }) },
    });
    const result = await router.run('test');
    expect(result.metadata.riskLevel).toBe('high');
  });
});
