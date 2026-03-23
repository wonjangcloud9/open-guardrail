import { describe, it, expect } from 'vitest';
import { createPipeline, pipe } from '../src/pipeline.js';
import type { Guard, GuardResult } from '../src/types.js';

const blockBadWords: Guard = {
  name: 'keyword', version: '1.0.0', description: 'test',
  category: 'security', supportedStages: ['input', 'output'],
  async check(text: string): Promise<GuardResult> {
    const bad = ['hack', 'exploit'];
    const found = bad.some((w) => text.toLowerCase().includes(w));
    return { guardName: 'keyword', passed: !found, action: found ? 'block' : 'allow', latencyMs: 0 };
  },
};

const maskEmail: Guard = {
  name: 'pii', version: '1.0.0', description: 'test',
  category: 'privacy', supportedStages: ['input', 'output'],
  async check(text: string): Promise<GuardResult> {
    const emailRe = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const hasEmail = emailRe.test(text);
    if (!hasEmail) return { guardName: 'pii', passed: true, action: 'allow', latencyMs: 0 };
    return {
      guardName: 'pii', passed: true, action: 'override',
      overrideText: text.replace(emailRe, '[EMAIL]'), latencyMs: 0,
    };
  },
};

describe('Integration', () => {
  it('full pipeline: block bad input', async () => {
    const p = createPipeline({ type: 'input', guards: [blockBadWords, maskEmail] });
    const result = await p.run('how to hack a system');
    expect(result.passed).toBe(false);
    expect(result.action).toBe('block');
  });

  it('full pipeline: mask PII and pass', async () => {
    const p = createPipeline({ type: 'input', mode: 'run-all', guards: [blockBadWords, maskEmail] });
    const result = await p.run('contact user@test.com for info');
    expect(result.passed).toBe(true);
    expect(result.output).toBe('contact [EMAIL] for info');
  });

  it('pipe() shorthand works end-to-end', async () => {
    const result = await pipe(blockBadWords).run('hello world');
    expect(result.passed).toBe(true);
  });

  it('event hooks fire correctly', async () => {
    const events: string[] = [];
    const p = createPipeline({ guards: [blockBadWords] });
    p.on('guard:before', async () => { events.push('before'); });
    p.on('guard:after', async () => { events.push('after'); });
    await p.run('safe text');
    expect(events).toEqual(['before', 'after']);
  });

  it('event hooks fire blocked event', async () => {
    let blocked = false;
    const p = createPipeline({ guards: [blockBadWords] });
    p.on('guard:blocked', async () => { blocked = true; });
    await p.run('exploit vulnerability');
    expect(blocked).toBe(true);
  });
});
