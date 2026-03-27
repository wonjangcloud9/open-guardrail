import { describe, it, expect } from 'vitest';
import { sessionHijack } from '../src/session-hijack.js';

describe('session-hijack guard', () => {
  it('passes clean text', async () => {
    const guard = sessionHijack({ action: 'block' });
    const r = await guard.check('Hello world', { pipelineType: 'input' });
    expect(r.passed).toBe(true);
  });
  it('blocks cookie access attempt', async () => {
    const guard = sessionHijack({ action: 'block' });
    const r = await guard.check('document.cookie', { pipelineType: 'input' });
    expect(r.passed).toBe(false);
  });
});
