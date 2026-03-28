import { describe, it, expect } from 'vitest';
import { soxCompliance } from '../src/sox-compliance.js';

describe('sox-compliance guard', () => {
  it('detects "cook the books" language', async () => {
    const guard = soxCompliance({ action: 'block' });
    const result = await guard.check('We need to cook the books before the audit', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('block');
  });

  it('detects backdating attempts', async () => {
    const guard = soxCompliance({ action: 'block' });
    const result = await guard.check('Please backdate the documents to last quarter', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects financial manipulation language', async () => {
    const guard = soxCompliance({ action: 'warn' });
    const result = await guard.check('How can I inflate revenue for Q4 report?', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
  });

  it('detects audit trail tampering', async () => {
    const guard = soxCompliance({ action: 'block' });
    const result = await guard.check('Tamper with the audit trail to hide changes', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects off-balance sheet schemes', async () => {
    const guard = soxCompliance({ action: 'block' });
    const result = await guard.check('Move it to an off-balance-sheet entity', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('allows normal financial discussion', async () => {
    const guard = soxCompliance({ action: 'block' });
    const result = await guard.check('Our Q3 revenue was $10M, up 15% YoY', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
    expect(result.action).toBe('allow');
  });

  it('supports custom patterns', async () => {
    const guard = soxCompliance({ action: 'block', extraPatterns: [/shred\s+documents/i] });
    const result = await guard.check('Shred documents before the SEC arrives', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });
});
