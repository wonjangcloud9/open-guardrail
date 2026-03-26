import { describe, it, expect } from 'vitest';
import { createCustomGuard, createKeywordGuard, createRegexGuard } from '../src/custom-guard-builder.js';

const ctx = { pipelineType: 'input' as const };

describe('createCustomGuard', () => {
  it('creates a guard with custom check logic', async () => {
    const guard = createCustomGuard(
      { name: 'length-check' },
      (text) => ({
        guardName: 'length-check',
        passed: text.length <= 10,
        action: text.length > 10 ? 'block' : 'allow',
        latencyMs: 0,
      }),
    );
    expect(guard.name).toBe('length-check');
    const result = await guard.check('short', ctx);
    expect(result.passed).toBe(true);
    const result2 = await guard.check('this is a very long text', ctx);
    expect(result2.passed).toBe(false);
  });
});

describe('createKeywordGuard', () => {
  it('blocks denied keywords', async () => {
    const guard = createKeywordGuard({
      name: 'brand-safety',
      action: 'block',
      denied: ['competitor', 'rival'],
    });
    const result = await guard.check('Use competitor instead', ctx);
    expect(result.passed).toBe(false);
    expect(result.details?.matched).toContain('competitor');
  });

  it('case-insensitive by default', async () => {
    const guard = createKeywordGuard({
      name: 'test',
      action: 'block',
      denied: ['BadWord'],
    });
    const result = await guard.check('contains badword here', ctx);
    expect(result.passed).toBe(false);
  });

  it('allows clean text', async () => {
    const guard = createKeywordGuard({
      name: 'test',
      action: 'block',
      denied: ['forbidden'],
    });
    const result = await guard.check('Hello world', ctx);
    expect(result.passed).toBe(true);
  });
});

describe('createRegexGuard', () => {
  it('detects custom patterns', async () => {
    const guard = createRegexGuard({
      name: 'order-id',
      action: 'block',
      patterns: [/ORD-\d{6}/g],
    });
    const result = await guard.check('Order ORD-123456 shipped', ctx);
    expect(result.passed).toBe(false);
  });

  it('masks matched patterns', async () => {
    const guard = createRegexGuard({
      name: 'mask-id',
      action: 'mask',
      patterns: [/ORD-\d{6}/g],
      maskLabel: '[ORDER_ID]',
    });
    const result = await guard.check('Order ORD-123456 shipped', ctx);
    expect(result.passed).toBe(true);
    expect(result.overrideText).toContain('[ORDER_ID]');
    expect(result.overrideText).not.toContain('ORD-123456');
  });

  it('allows text without matches', async () => {
    const guard = createRegexGuard({
      name: 'test',
      action: 'block',
      patterns: [/SECRET-\d+/g],
    });
    const result = await guard.check('Nothing here', ctx);
    expect(result.passed).toBe(true);
  });
});
