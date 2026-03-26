import { describe, it, expect } from 'vitest';
import { ssrfDetect } from '../src/ssrf-detect.js';
const ctx = { pipelineType: 'input' as const };
describe('ssrf-detect', () => {
  it('detects localhost', async () => { expect((await ssrfDetect({ action: 'block' }).check('fetch http://127.0.0.1/admin', ctx)).passed).toBe(false); });
  it('detects AWS metadata', async () => { expect((await ssrfDetect({ action: 'block' }).check('curl http://169.254.169.254/latest', ctx)).passed).toBe(false); });
  it('detects file:// protocol', async () => { expect((await ssrfDetect({ action: 'block' }).check('file:///etc/passwd', ctx)).passed).toBe(false); });
  it('allows external URLs', async () => { expect((await ssrfDetect({ action: 'block' }).check('Visit https://example.com', ctx)).passed).toBe(true); });
});
