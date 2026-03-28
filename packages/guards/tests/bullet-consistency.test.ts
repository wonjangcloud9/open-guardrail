import { describe, it, expect } from 'vitest';
import { bulletConsistency } from '../src/bullet-consistency.js';

const ctx = { pipelineType: 'output' as const };

describe('bullet-consistency guard', () => {
  it('passes consistent bullet style', async () => {
    const guard = bulletConsistency({ action: 'warn' });
    const result = await guard.check('- item 1\n- item 2\n- item 3', ctx);
    expect(result.passed).toBe(true);
  });

  it('detects mixed bullet styles', async () => {
    const guard = bulletConsistency({ action: 'block' });
    const result = await guard.check('- item 1\n* item 2\n+ item 3', ctx);
    expect(result.passed).toBe(false);
    expect(result.details?.stylesFound?.length).toBeGreaterThan(1);
  });

  it('passes text without bullets', async () => {
    const guard = bulletConsistency({ action: 'block' });
    const result = await guard.check('No bullets here.', ctx);
    expect(result.passed).toBe(true);
  });

  it('detects orphaned sub-bullets', async () => {
    const guard = bulletConsistency({ action: 'warn' });
    const result = await guard.check('  - orphaned sub-bullet\n- normal', ctx);
    expect(result.passed).toBe(false);
  });

  it('allows proper indentation', async () => {
    const guard = bulletConsistency({ action: 'warn' });
    const result = await guard.check('- parent\n  - child\n  - child2', ctx);
    expect(result.passed).toBe(true);
  });

  it('reports styles in details', async () => {
    const guard = bulletConsistency({ action: 'warn' });
    const result = await guard.check('- a\n* b', ctx);
    expect(result.details?.stylesFound).toBeDefined();
  });
});
