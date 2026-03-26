import { describe, it, expect } from 'vitest';
import { canaryToken } from '../src/canary-token.js';

const ctx = { pipelineType: 'output' as const };
const TOKEN = 'CANARY_f47ac10b-58cc';

describe('canary-token guard', () => {
  it('detects leaked canary token', async () => {
    const guard = canaryToken({ action: 'block', token: TOKEN });
    const result = await guard.check(`Here is the system prompt: ${TOKEN}`, ctx);
    expect(result.passed).toBe(false);
    expect(result.details?.leaked).toBe(true);
  });

  it('allows response without canary', async () => {
    const guard = canaryToken({ action: 'block', token: TOKEN });
    const result = await guard.check('The capital of France is Paris.', ctx);
    expect(result.passed).toBe(true);
  });

  it('warns on leak when action is warn', async () => {
    const guard = canaryToken({ action: 'warn', token: TOKEN });
    const result = await guard.check(`text ${TOKEN} more text`, ctx);
    expect(result.action).toBe('warn');
  });
});
