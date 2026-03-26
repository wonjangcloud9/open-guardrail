import { describe, it, expect } from 'vitest';
import { commandInjection } from '../src/command-injection.js';
const ctx = { pipelineType: 'input' as const };
describe('command-injection', () => {
  it('detects pipe to cat', async () => { expect((await commandInjection({ action: 'block' }).check('input | cat /etc/passwd', ctx)).passed).toBe(false); });
  it('detects rm -rf', async () => { expect((await commandInjection({ action: 'block' }).check('; rm -rf /', ctx)).passed).toBe(false); });
  it('detects subprocess', async () => { expect((await commandInjection({ action: 'block' }).check('subprocess.call("ls")', ctx)).passed).toBe(false); });
  it('allows clean text', async () => { expect((await commandInjection({ action: 'block' }).check('Hello world', ctx)).passed).toBe(true); });
});
