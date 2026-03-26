import { describe, it, expect } from 'vitest';
import { regexAllow } from '../src/regex-allow.js';
const ctx = { pipelineType: 'output' as const };
describe('regex-allow', () => {
  it('blocks when no pattern matches', async () => {
    const g = regexAllow({ action: 'block', patterns: [{ pattern: '\\d{4}-\\d{2}-\\d{2}', label: 'date' }] });
    expect((await g.check('No date here', ctx)).passed).toBe(false);
  });
  it('allows when pattern matches', async () => {
    const g = regexAllow({ action: 'block', patterns: [{ pattern: '\\d{4}-\\d{2}-\\d{2}', label: 'date' }] });
    expect((await g.check('Date: 2024-01-15', ctx)).passed).toBe(true);
  });
  it('requireAll checks all patterns', async () => {
    const g = regexAllow({ action: 'block', requireAll: true, patterns: [{ pattern: 'Summary:', label: 'summary' }, { pattern: 'Conclusion:', label: 'conclusion' }] });
    expect((await g.check('Summary: yes. But no conclusion.', ctx)).passed).toBe(false);
  });
});
