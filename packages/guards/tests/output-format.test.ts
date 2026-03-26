import { describe, it, expect } from 'vitest';
import { outputFormat } from '../src/output-format.js';
const ctx = { pipelineType: 'output' as const };
describe('output-format', () => {
  it('validates JSON', async () => {
    expect((await outputFormat({ action: 'block', expected: 'json' }).check('{"a":1}', ctx)).passed).toBe(true);
    expect((await outputFormat({ action: 'block', expected: 'json' }).check('not json', ctx)).passed).toBe(false);
  });
  it('validates markdown', async () => {
    expect((await outputFormat({ action: 'block', expected: 'markdown' }).check('# Title\n- item', ctx)).passed).toBe(true);
  });
  it('validates plain', async () => {
    expect((await outputFormat({ action: 'block', expected: 'plain' }).check('Just plain text here', ctx)).passed).toBe(true);
  });
});
