import { describe, it, expect } from 'vitest';
import { pathTraversal } from '../src/path-traversal.js';
const ctx = { pipelineType: 'input' as const };
describe('path-traversal', () => {
  it('detects ../  pattern', async () => {
    expect((await pathTraversal({ action: 'block' }).check('Read ../../etc/passwd', ctx)).passed).toBe(false);
  });
  it('detects /etc/passwd', async () => {
    expect((await pathTraversal({ action: 'block' }).check('cat /etc/passwd', ctx)).passed).toBe(false);
  });
  it('allows clean text', async () => {
    expect((await pathTraversal({ action: 'block' }).check('Hello world', ctx)).passed).toBe(true);
  });
});
