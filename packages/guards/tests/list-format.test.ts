import { describe, it, expect } from 'vitest';
import { listFormat } from '../src/list-format.js';

describe('list-format guard', () => {
  it('passes correctly numbered list', async () => {
    const guard = listFormat({ action: 'warn' });
    const text = '1. First\n2. Second\n3. Third';
    const result = await guard.check(text, { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('detects numbering gaps', async () => {
    const guard = listFormat({ action: 'warn' });
    const text = '1. First\n2. Second\n5. Fifth';
    const result = await guard.check(text, { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects mixed bullet styles', async () => {
    const guard = listFormat({ action: 'warn' });
    const text = '- Item one\n* Item two\n+ Item three';
    const result = await guard.check(text, { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('passes consistent bullets', async () => {
    const guard = listFormat({ action: 'warn' });
    const text = '- Item one\n- Item two\n- Item three';
    const result = await guard.check(text, { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('detects too many items', async () => {
    const guard = listFormat({ action: 'block', maxItems: 3 });
    const text = '1. A\n2. B\n3. C\n4. D';
    const result = await guard.check(text, { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('allows plain text without lists', async () => {
    const guard = listFormat({ action: 'block' });
    const result = await guard.check('This is just a paragraph.', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });
});
